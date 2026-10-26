"""CRUD de Manos en Red: crear, leer, actualizar y borrar datos.

Funciona sobre la conexión de db.py (psycopg2 + SQLAlchemy, base
HACKATON_DB, esquema «mer»). Cada función recibe una sesión (`db`). Las que
modifican datos guardan con _guardar(): COMMIT si todo sale bien y ROLLBACK
si PostgreSQL rechaza algo, para que la sesión quede lista para la siguiente
operación. Si la base rechaza la operación por una regla de negocio
(organización sin verificar, convocatoria llena, emergencia sin confirmar…),
la excepción sube a la API, que responde con 409.

Uso fuera de FastAPI (por ejemplo, en un script):
    from db import SessionLocal
    import crud, schemas
    with SessionLocal() as db:
        crud.crear_habilidad(db, schemas.HabilidadCrear(nombre="Fotografía", categoria="comunicacion"))
"""
import hashlib
import hmac
import secrets
import string
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload

import models as m
import schemas as s

VERSION_POLITICA = "2026-10"


# ===========================================================================
# Utilidades
# ===========================================================================
def ahora() -> datetime:
    return datetime.now(timezone.utc)


def _enviar(db: Session) -> None:
    """flush (envía sin confirmar) con rollback si falla, igual que _guardar."""
    try:
        db.flush()
    except Exception:
        db.rollback()
        raise


def _guardar(db: Session) -> None:
    """Confirma los cambios en PostgreSQL. Si la base los rechaza, los deshace
    (rollback) para no dejar la sesión bloqueada y vuelve a lanzar el error."""
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def hash_contrasena(contrasena: str) -> str:
    """scrypt de la librería estándar: no requiere dependencias extra."""
    sal = secrets.token_bytes(16)
    clave = hashlib.scrypt(contrasena.encode(), salt=sal, n=2**14, r=8, p=1)
    return f"scrypt$16384$8$1${sal.hex()}${clave.hex()}"


def verificar_contrasena(contrasena: str, guardado: str) -> bool:
    # Los datos de ejemplo (datos_ejemplo.sql) guardan bcrypt generado con pgcrypto.
    if guardado.startswith(("$2a$", "$2b$", "$2y$")):
        import bcrypt

        return bcrypt.checkpw(contrasena.encode(), guardado.encode())
    try:
        _, n, r, p, sal, clave = guardado.split("$")
    except ValueError:
        return False
    calculada = hashlib.scrypt(
        contrasena.encode(), salt=bytes.fromhex(sal), n=int(n), r=int(r), p=int(p)
    )
    return hmac.compare_digest(calculada.hex(), clave)


def _codigo_voluntario(db: Session) -> str:
    """Genera un código único del tipo MR-4821."""
    while True:
        codigo = f"MR-{secrets.randbelow(9000) + 1000}"
        if not db.scalar(select(m.Voluntario.usuario_id).where(m.Voluntario.codigo == codigo)):
            return codigo


def _alias_participacion(db: Session, convocatoria_id: uuid.UUID) -> str:
    """Alias anónimo por convocatoria (A12): la organización nunca ve el nombre."""
    while True:
        alias = secrets.choice(string.ascii_uppercase) + f"{secrets.randbelow(100):02d}"
        existe = db.scalar(
            select(m.Participacion.id).where(
                m.Participacion.convocatoria_id == convocatoria_id, m.Participacion.alias == alias
            )
        )
        if not existe:
            return alias


def _cambios(datos, excluir: set[str] = frozenset()) -> dict:
    """Solo los campos que el cliente envió (actualizaciones parciales)."""
    return {k: v for k, v in datos.model_dump(exclude_unset=True).items() if k not in excluir}


# ===========================================================================
# Usuarios y autenticación
# ===========================================================================
def obtener_usuario(db: Session, usuario_id: uuid.UUID) -> m.Usuario | None:
    return db.get(m.Usuario, usuario_id)


def obtener_usuario_por_correo(db: Session, correo: str) -> m.Usuario | None:
    return db.scalar(select(m.Usuario).where(m.Usuario.correo == correo))


def autenticar(db: Session, correo: str, contrasena: str) -> m.Usuario | None:
    usuario = obtener_usuario_por_correo(db, correo)
    if not usuario or not usuario.activo or not verificar_contrasena(contrasena, usuario.hash_contrasena):
        return None
    usuario.ultimo_acceso = ahora()
    _guardar(db)
    return usuario


def eliminar_usuario(db: Session, usuario_id: uuid.UUID) -> bool:
    """Elimina la cuenta y, en cascada, sus datos personales (derecho de supresión, Ley 1581)."""
    usuario = db.get(m.Usuario, usuario_id)
    if not usuario:
        return False
    db.delete(usuario)
    _guardar(db)
    return True


def revocar_consentimiento(db: Session, usuario_id: uuid.UUID) -> bool:
    consentimiento = db.scalar(
        select(m.Consentimiento).where(
            m.Consentimiento.usuario_id == usuario_id, m.Consentimiento.revocado_en.is_(None)
        )
    )
    if not consentimiento:
        return False
    consentimiento.revocado_en = ahora()
    # Sin autorización vigente no se le puede contactar
    voluntario = db.get(m.Voluntario, usuario_id)
    if voluntario:
        voluntario.recibir_convocatorias = False
        voluntario.acepta_emergencias = False
    _guardar(db)
    return True


# ===========================================================================
# Voluntarios
# ===========================================================================
def _consulta_voluntario():
    return select(m.Voluntario).options(
        selectinload(m.Voluntario.usuario),
        selectinload(m.Voluntario.habilidades).selectinload(m.VoluntarioHabilidad.habilidad),
        selectinload(m.Voluntario.disponibilidades),
    )


def crear_voluntario(db: Session, datos: s.VoluntarioCrear) -> m.Voluntario:
    usuario = m.Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        telefono=datos.telefono,
        hash_contrasena=hash_contrasena(datos.contrasena),
        rol=m.RolUsuario.voluntario,
    )
    db.add(usuario)
    _enviar(db)  # obtiene usuario.id (falla aquí si el correo ya existe)

    voluntario = m.Voluntario(
        usuario_id=usuario.id,
        codigo=_codigo_voluntario(db),
        barrio=datos.barrio,
        municipio=datos.municipio,
        codigo_divipola=datos.codigo_divipola,
        lat_aprox=datos.lat,
        lon_aprox=datos.lon,
        radio_km=datos.radio_km,
        acepta_emergencias=datos.acepta_emergencias,
        solo_emergencias=datos.solo_emergencias,
    )
    voluntario.habilidades = [m.VoluntarioHabilidad(habilidad_id=h) for h in set(datos.habilidad_ids)]
    voluntario.disponibilidades = [
        m.Disponibilidad(dia_semana=d.dia_semana, franja=d.franja)
        for d in {(d.dia_semana, d.franja): d for d in datos.disponibilidades}.values()
    ]
    db.add(voluntario)
    db.add(
        m.Consentimiento(
            usuario_id=usuario.id,
            version_politica=VERSION_POLITICA,
            finalidades=["convocatorias", "emergencias", "historial_horas"],
        )
    )
    _guardar(db)
    return obtener_voluntario(db, usuario.id)


def obtener_voluntario(db: Session, usuario_id: uuid.UUID) -> m.Voluntario | None:
    return db.scalar(_consulta_voluntario().where(m.Voluntario.usuario_id == usuario_id))


def listar_voluntarios(
    db: Session, municipio: str | None = None, habilidad_id: int | None = None, saltar: int = 0, limite: int = 50
) -> list[m.Voluntario]:
    consulta = _consulta_voluntario().order_by(m.Voluntario.creado_en.desc()).offset(saltar).limit(limite)
    if municipio:
        consulta = consulta.where(m.Voluntario.municipio == municipio)
    if habilidad_id:
        consulta = consulta.where(
            m.Voluntario.habilidades.any(m.VoluntarioHabilidad.habilidad_id == habilidad_id)
        )
    return list(db.scalars(consulta))


def actualizar_voluntario(
    db: Session, usuario_id: uuid.UUID, datos: s.VoluntarioActualizar
) -> m.Voluntario | None:
    voluntario = obtener_voluntario(db, usuario_id)
    if not voluntario:
        return None
    cambios = _cambios(datos, excluir={"habilidad_ids", "disponibilidades", "nombre", "telefono", "lat", "lon"})
    for campo, valor in cambios.items():
        setattr(voluntario, campo, valor)

    enviados = datos.model_fields_set
    if "nombre" in enviados:
        voluntario.usuario.nombre = datos.nombre
    if "telefono" in enviados:
        voluntario.usuario.telefono = datos.telefono
    if "lat" in enviados and datos.lat is not None:
        voluntario.lat_aprox = datos.lat
    if "lon" in enviados and datos.lon is not None:
        voluntario.lon_aprox = datos.lon
    if datos.habilidad_ids is not None:
        voluntario.habilidades = [m.VoluntarioHabilidad(habilidad_id=h) for h in set(datos.habilidad_ids)]
    if datos.disponibilidades is not None:
        voluntario.disponibilidades = [
            m.Disponibilidad(dia_semana=d.dia_semana, franja=d.franja)
            for d in {(d.dia_semana, d.franja): d for d in datos.disponibilidades}.values()
        ]
    _guardar(db)
    return obtener_voluntario(db, usuario_id)


def horas_voluntario(db: Session, usuario_id: uuid.UUID) -> dict:
    fila = db.execute(
        text("SELECT turnos_cumplidos, horas_voluntariado FROM v_horas_voluntario WHERE usuario_id = :id"),
        {"id": usuario_id},
    ).mappings().first()
    return dict(fila) if fila else {"turnos_cumplidos": 0, "horas_voluntariado": 0}


# ===========================================================================
# Habilidades
# ===========================================================================
def listar_habilidades(db: Session) -> list[m.Habilidad]:
    return list(db.scalars(select(m.Habilidad).order_by(m.Habilidad.nombre)))


def crear_habilidad(db: Session, datos: s.HabilidadCrear) -> m.Habilidad:
    habilidad = m.Habilidad(**datos.model_dump())
    db.add(habilidad)
    _guardar(db)
    db.refresh(habilidad)
    return habilidad


def actualizar_habilidad(db: Session, habilidad_id: int, datos: s.HabilidadActualizar) -> m.Habilidad | None:
    habilidad = db.get(m.Habilidad, habilidad_id)
    if not habilidad:
        return None
    for campo, valor in _cambios(datos).items():
        setattr(habilidad, campo, valor)
    _guardar(db)
    db.refresh(habilidad)
    return habilidad


def eliminar_habilidad(db: Session, habilidad_id: int) -> bool:
    """Falla (IntegrityError) si algún voluntario o convocatoria la usa: así no se pierden datos."""
    habilidad = db.get(m.Habilidad, habilidad_id)
    if not habilidad:
        return False
    db.delete(habilidad)
    _guardar(db)
    return True


# ===========================================================================
# Organizaciones
# ===========================================================================
def crear_organizacion(db: Session, datos: s.OrganizacionCrear) -> m.Organizacion:
    responsable = m.Usuario(
        nombre=datos.responsable_nombre,
        correo=datos.responsable_correo,
        hash_contrasena=hash_contrasena(datos.responsable_contrasena),
        rol=m.RolUsuario.organizacion,
    )
    db.add(responsable)
    _enviar(db)

    organizacion = m.Organizacion(
        **datos.model_dump(
            include={"nombre", "nit", "tipo", "correo", "telefono", "barrio", "municipio",
                     "codigo_divipola", "lat", "lon"}
        )
    )
    organizacion.miembros = [m.OrganizacionMiembro(usuario_id=responsable.id, rol=m.RolMiembro.administrador)]
    db.add(organizacion)
    db.add(
        m.Consentimiento(
            usuario_id=responsable.id, version_politica=VERSION_POLITICA, finalidades=["gestion_organizacion"]
        )
    )
    _guardar(db)
    db.refresh(organizacion)
    return organizacion


def obtener_organizacion(db: Session, organizacion_id: uuid.UUID) -> m.Organizacion | None:
    return db.get(m.Organizacion, organizacion_id)


def listar_organizaciones(
    db: Session, estado: m.EstadoVerificacion | None = None, saltar: int = 0, limite: int = 50
) -> list[m.Organizacion]:
    consulta = select(m.Organizacion).order_by(m.Organizacion.nombre).offset(saltar).limit(limite)
    if estado:
        consulta = consulta.where(m.Organizacion.estado_verificacion == estado)
    return list(db.scalars(consulta))


def actualizar_organizacion(
    db: Session, organizacion_id: uuid.UUID, datos: s.OrganizacionActualizar
) -> m.Organizacion | None:
    organizacion = db.get(m.Organizacion, organizacion_id)
    if not organizacion:
        return None
    for campo, valor in _cambios(datos).items():
        setattr(organizacion, campo, valor)
    _guardar(db)
    db.refresh(organizacion)
    return organizacion


def verificar_organizacion(
    db: Session, organizacion_id: uuid.UUID, administrador_id: uuid.UUID, aprobar: bool
) -> m.Organizacion | None:
    organizacion = db.get(m.Organizacion, organizacion_id)
    if not organizacion:
        return None
    organizacion.estado_verificacion = (
        m.EstadoVerificacion.verificada if aprobar else m.EstadoVerificacion.rechazada
    )
    organizacion.verificada_por = administrador_id
    organizacion.verificada_en = ahora()
    db.add(
        m.Auditoria(
            tabla="organizaciones",
            registro_id=str(organizacion_id),
            accion="verificacion:" + organizacion.estado_verificacion.value,
            usuario_id=administrador_id,
        )
    )
    _guardar(db)
    db.refresh(organizacion)
    return organizacion


def eliminar_organizacion(db: Session, organizacion_id: uuid.UUID) -> bool:
    """Falla si la organización ya tiene convocatorias o emergencias (se conserva el historial)."""
    organizacion = db.get(m.Organizacion, organizacion_id)
    if not organizacion:
        return False
    db.delete(organizacion)
    _guardar(db)
    return True


# ===========================================================================
# Modo Emergencia
# ===========================================================================
def solicitar_emergencia(db: Session, organizacion_id: uuid.UUID, datos: s.EmergenciaCrear) -> m.Emergencia:
    """Queda «por_confirmar». El trigger rechaza la solicitud si la organización no está verificada."""
    emergencia = m.Emergencia(solicitada_por=organizacion_id, **datos.model_dump())
    db.add(emergencia)
    _guardar(db)
    db.refresh(emergencia)
    return emergencia


def confirmar_emergencia(db: Session, emergencia_id: uuid.UUID, confirmada_por: uuid.UUID) -> m.Emergencia | None:
    """Segunda confirmación: pasa a «activa» y queda registrada en auditoría (trigger)."""
    emergencia = db.get(m.Emergencia, emergencia_id)
    if not emergencia:
        return None
    emergencia.estado = m.EstadoEmergencia.activa
    emergencia.confirmada_por = confirmada_por
    emergencia.activada_en = ahora()
    _guardar(db)
    db.refresh(emergencia)
    return emergencia


def cerrar_emergencia(db: Session, emergencia_id: uuid.UUID) -> m.Emergencia | None:
    emergencia = db.get(m.Emergencia, emergencia_id)
    if not emergencia:
        return None
    emergencia.estado = m.EstadoEmergencia.cerrada
    emergencia.cerrada_en = ahora()
    # Las convocatorias abiertas de esa emergencia se cierran también
    for convocatoria in db.scalars(
        select(m.Convocatoria).where(
            m.Convocatoria.emergencia_id == emergencia_id,
            m.Convocatoria.estado.in_([m.EstadoConvocatoria.publicada, m.EstadoConvocatoria.cubierta]),
        )
    ):
        convocatoria.estado = m.EstadoConvocatoria.cerrada
    _guardar(db)
    db.refresh(emergencia)
    return emergencia


def obtener_emergencia(db: Session, emergencia_id: uuid.UUID) -> m.Emergencia | None:
    return db.get(m.Emergencia, emergencia_id)


def listar_emergencias(db: Session, solo_activas: bool = True) -> list[m.Emergencia]:
    consulta = select(m.Emergencia).order_by(m.Emergencia.solicitada_en.desc())
    if solo_activas:
        consulta = consulta.where(m.Emergencia.estado == m.EstadoEmergencia.activa)
    return list(db.scalars(consulta))


# ---- Puntos de operación ---------------------------------------------------
def crear_punto(db: Session, organizacion_id: uuid.UUID, datos: s.PuntoCrear) -> m.PuntoOperacion:
    punto = m.PuntoOperacion(organizacion_id=organizacion_id, **datos.model_dump())
    db.add(punto)
    _guardar(db)
    db.refresh(punto)
    return punto


def listar_puntos(
    db: Session, emergencia_id: uuid.UUID | None = None, solo_publicos: bool = False
) -> list[m.PuntoOperacion]:
    consulta = select(m.PuntoOperacion).where(m.PuntoOperacion.activo.is_(True))
    if emergencia_id:
        consulta = consulta.where(m.PuntoOperacion.emergencia_id == emergencia_id)
    if solo_publicos:
        consulta = consulta.where(m.PuntoOperacion.publico.is_(True))
    return list(db.scalars(consulta.order_by(m.PuntoOperacion.nombre)))


def actualizar_punto(db: Session, punto_id: uuid.UUID, datos: s.PuntoActualizar) -> m.PuntoOperacion | None:
    punto = db.get(m.PuntoOperacion, punto_id)
    if not punto:
        return None
    for campo, valor in _cambios(datos).items():
        setattr(punto, campo, valor)
    _guardar(db)
    db.refresh(punto)
    return punto


def desactivar_punto(db: Session, punto_id: uuid.UUID) -> bool:
    """Borrado lógico: el punto deja de mostrarse pero se conserva el historial."""
    punto = db.get(m.PuntoOperacion, punto_id)
    if not punto:
        return False
    punto.activo = False
    _guardar(db)
    return True


# ===========================================================================
# Convocatorias
# ===========================================================================
def crear_convocatoria(db: Session, organizacion_id: uuid.UUID, datos: s.ConvocatoriaCrear) -> m.Convocatoria:
    valores = datos.model_dump(exclude={"habilidad_ids", "publicar"})
    convocatoria = m.Convocatoria(organizacion_id=organizacion_id, **valores)
    if datos.publicar:
        convocatoria.estado = m.EstadoConvocatoria.publicada
        convocatoria.publicada_en = ahora()
    convocatoria.habilidades = [m.ConvocatoriaHabilidad(habilidad_id=h) for h in set(datos.habilidad_ids)]
    db.add(convocatoria)
    _guardar(db)  # el trigger valida organización verificada y emergencia activa
    db.refresh(convocatoria)
    return convocatoria


def obtener_convocatoria(db: Session, convocatoria_id: uuid.UUID) -> m.Convocatoria | None:
    return db.get(m.Convocatoria, convocatoria_id)


def listar_convocatorias(
    db: Session,
    organizacion_id: uuid.UUID | None = None,
    estado: m.EstadoConvocatoria | None = None,
    tipo: m.TipoConvocatoria | None = None,
    saltar: int = 0,
    limite: int = 50,
) -> list[m.Convocatoria]:
    consulta = select(m.Convocatoria).order_by(m.Convocatoria.inicio.desc()).offset(saltar).limit(limite)
    if organizacion_id:
        consulta = consulta.where(m.Convocatoria.organizacion_id == organizacion_id)
    if estado:
        consulta = consulta.where(m.Convocatoria.estado == estado)
    if tipo:
        consulta = consulta.where(m.Convocatoria.tipo == tipo)
    return list(db.scalars(consulta))


def listar_convocatorias_cercanas(db: Session, voluntario_id: uuid.UUID) -> list[m.Convocatoria]:
    """Convocatorias publicadas dentro del radio del voluntario y con al menos una de sus habilidades."""
    ids = db.scalars(
        text(
            """
            SELECT c.id
              FROM voluntarios v
              JOIN convocatorias c ON c.estado = 'publicada'
             WHERE v.usuario_id = :vol
               AND earth_distance(ll_to_earth(c.lat::float8, c.lon::float8),
                                  ll_to_earth(v.lat_aprox::float8, v.lon_aprox::float8)) <= v.radio_km::float8 * 1000
               AND EXISTS (SELECT 1 FROM convocatoria_habilidades ch
                             JOIN voluntario_habilidades vh ON vh.habilidad_id = ch.habilidad_id
                            WHERE ch.convocatoria_id = c.id AND vh.voluntario_id = v.usuario_id)
             ORDER BY c.inicio
            """
        ),
        {"vol": voluntario_id},
    ).all()
    if not ids:
        return []
    return list(db.scalars(select(m.Convocatoria).where(m.Convocatoria.id.in_(ids)).order_by(m.Convocatoria.inicio)))


def actualizar_convocatoria(
    db: Session, convocatoria_id: uuid.UUID, datos: s.ConvocatoriaActualizar
) -> m.Convocatoria | None:
    convocatoria = db.get(m.Convocatoria, convocatoria_id)
    if not convocatoria:
        return None
    if convocatoria.estado in (m.EstadoConvocatoria.cerrada, m.EstadoConvocatoria.cancelada):
        raise ValueError("No se puede editar una convocatoria cerrada o cancelada")
    for campo, valor in _cambios(datos, excluir={"habilidad_ids"}).items():
        setattr(convocatoria, campo, valor)
    if datos.habilidad_ids is not None:
        convocatoria.habilidades = [m.ConvocatoriaHabilidad(habilidad_id=h) for h in set(datos.habilidad_ids)]
    _guardar(db)
    db.refresh(convocatoria)
    return convocatoria


def cambiar_estado_convocatoria(
    db: Session, convocatoria_id: uuid.UUID, nuevo: m.EstadoConvocatoria
) -> m.Convocatoria | None:
    """Publicar, marcar como cubierta, cerrar o cancelar."""
    convocatoria = db.get(m.Convocatoria, convocatoria_id)
    if not convocatoria:
        return None
    convocatoria.estado = nuevo
    if nuevo == m.EstadoConvocatoria.publicada and convocatoria.publicada_en is None:
        convocatoria.publicada_en = ahora()
    _guardar(db)
    db.refresh(convocatoria)
    return convocatoria


def eliminar_convocatoria(db: Session, convocatoria_id: uuid.UUID) -> bool:
    """Solo se borran borradores; una convocatoria publicada se cancela para conservar el historial."""
    convocatoria = db.get(m.Convocatoria, convocatoria_id)
    if not convocatoria:
        return False
    if convocatoria.estado != m.EstadoConvocatoria.borrador:
        raise ValueError("Solo se pueden eliminar borradores; usa «cancelar» para las publicadas")
    db.delete(convocatoria)
    _guardar(db)
    return True


# ---- Emparejamiento (funciones de PostgreSQL) -----------------------------
def candidatos(db: Session, convocatoria_id: uuid.UUID) -> list[dict]:
    filas = db.execute(text("SELECT * FROM candidatos_convocatoria(:id)"), {"id": convocatoria_id})
    return [dict(f) for f in filas.mappings()]


def embudo(db: Session, convocatoria_id: uuid.UUID) -> dict | None:
    fila = db.execute(text("SELECT * FROM embudo_convocatoria(:id)"), {"id": convocatoria_id}).mappings().first()
    return dict(fila) if fila else None


def convocar(db: Session, convocatoria_id: uuid.UUID, limite: int | None = None) -> int:
    """Crea participaciones con alias y encola las notificaciones. Devuelve cuántos convocó."""
    total = db.scalar(text("SELECT convocar(:id, :limite)"), {"id": convocatoria_id, "limite": limite})
    _guardar(db)
    return total or 0


def resumen_convocatoria(db: Session, convocatoria_id: uuid.UUID) -> dict | None:
    fila = db.execute(
        text(
            "SELECT id, titulo, tipo, estado, cupos, convocados, confirmados, no_pueden, "
            "sin_respuesta, porcentaje_cubierto FROM v_resumen_convocatorias WHERE id = :id"
        ),
        {"id": convocatoria_id},
    ).mappings().first()
    return dict(fila) if fila else None


# ===========================================================================
# Participaciones
# ===========================================================================
def postularse(db: Session, convocatoria_id: uuid.UUID, voluntario_id: uuid.UUID) -> m.Participacion:
    distancia = db.scalar(
        text(
            "SELECT distancia_km(c.lat, c.lon, v.lat_aprox, v.lon_aprox) "
            "FROM convocatorias c, voluntarios v WHERE c.id = :c AND v.usuario_id = :v"
        ),
        {"c": convocatoria_id, "v": voluntario_id},
    )
    participacion = m.Participacion(
        convocatoria_id=convocatoria_id,
        voluntario_id=voluntario_id,
        alias=_alias_participacion(db, convocatoria_id),
        origen=m.OrigenParticipacion.postulacion,
        distancia_km=distancia,
    )
    db.add(participacion)
    _guardar(db)
    db.refresh(participacion)
    return participacion


def responder(db: Session, participacion_id: int, datos: s.RespuestaEntrada) -> m.Participacion | None:
    """Confirmar, «en camino» o «no puedo». El trigger impide confirmar por encima del cupo."""
    participacion = db.get(m.Participacion, participacion_id)
    if not participacion:
        return None
    participacion.estado = datos.estado
    participacion.detalle = datos.detalle
    participacion.respondido_en = ahora()
    _guardar(db)
    db.refresh(participacion)
    return participacion


def listar_participaciones(db: Session, convocatoria_id: uuid.UUID) -> list[m.Participacion]:
    return list(
        db.scalars(
            select(m.Participacion)
            .where(m.Participacion.convocatoria_id == convocatoria_id)
            .order_by(m.Participacion.alias)
        )
    )


def participaciones_de_voluntario(db: Session, voluntario_id: uuid.UUID) -> list[m.Participacion]:
    return list(
        db.scalars(
            select(m.Participacion)
            .where(m.Participacion.voluntario_id == voluntario_id)
            .order_by(m.Participacion.creado_en.desc())
        )
    )


def cancelar_participacion(db: Session, participacion_id: int) -> m.Participacion | None:
    """El voluntario se retira: libera el cupo (la convocatoria vuelve a «publicada» si estaba cubierta)."""
    participacion = db.get(m.Participacion, participacion_id)
    if not participacion:
        return None
    participacion.estado = m.EstadoParticipacion.cancelado
    participacion.respondido_en = ahora()
    _guardar(db)
    db.refresh(participacion)
    return participacion


# ===========================================================================
# Asistencia (check-in / check-out)
# ===========================================================================
def registrar_entrada(
    db: Session, participacion_id: int, registrado_por: uuid.UUID | None = None
) -> m.Asistencia:
    participacion = db.get(m.Participacion, participacion_id)
    if not participacion or participacion.estado not in (
        m.EstadoParticipacion.confirmado,
        m.EstadoParticipacion.en_camino,
    ):
        raise ValueError("Solo se registra la entrada de voluntarios confirmados")
    asistencia = m.Asistencia(participacion_id=participacion_id, check_in=ahora(), registrado_por=registrado_por)
    db.add(asistencia)
    _guardar(db)
    db.refresh(asistencia)
    return asistencia


def registrar_salida(db: Session, participacion_id: int) -> m.Asistencia | None:
    asistencia = db.scalar(select(m.Asistencia).where(m.Asistencia.participacion_id == participacion_id))
    if not asistencia:
        return None
    asistencia.check_out = ahora()
    _guardar(db)
    db.refresh(asistencia)  # trae las horas calculadas por PostgreSQL
    return asistencia


# ===========================================================================
# Notificaciones (para el servicio que envía push/correo)
# ===========================================================================
def tomar_notificaciones(db: Session, limite: int = 100) -> list[m.Notificacion]:
    """Toma la cola sin chocar con otros procesos (FOR UPDATE SKIP LOCKED).
    Llamar dentro de una transacción y luego marcar_enviada / marcar_fallida."""
    return list(
        db.scalars(
            select(m.Notificacion)
            .where(m.Notificacion.estado == m.EstadoNotificacion.encolada)
            .order_by(m.Notificacion.encolada_en)
            .limit(limite)
            .with_for_update(skip_locked=True)
        )
    )


def marcar_enviada(db: Session, notificacion_id: int) -> None:
    notificacion = db.get(m.Notificacion, notificacion_id)
    if notificacion:
        notificacion.estado = m.EstadoNotificacion.enviada
        notificacion.enviada_en = ahora()
        notificacion.intentos += 1
        _guardar(db)


def marcar_fallida(db: Session, notificacion_id: int) -> None:
    notificacion = db.get(m.Notificacion, notificacion_id)
    if notificacion:
        notificacion.intentos += 1
        notificacion.estado = (
            m.EstadoNotificacion.fallida if notificacion.intentos >= 3 else m.EstadoNotificacion.encolada
        )
        _guardar(db)


def contar_notificaciones_pendientes(db: Session) -> int:
    return db.scalar(
        select(func.count()).select_from(m.Notificacion).where(
            m.Notificacion.estado == m.EstadoNotificacion.encolada
        )
    ) or 0
