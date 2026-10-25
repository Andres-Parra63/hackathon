"""Modelos SQLAlchemy 2.0 que reflejan exactamente el esquema «mer».

Las tablas, tipos, triggers y funciones se crean con manos_en_red_crear_tablas.sql;
estos modelos NO crean nada (no llamar a Base.metadata.create_all).
"""
import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    Computed,
    ForeignKey,
    Identity,
    Numeric,
    SmallInteger,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, ENUM, JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import ESQUEMA, Base


# ---------------------------------------------------------------------------
# Tipos enumerados (mismos valores que los CREATE TYPE de PostgreSQL)
# ---------------------------------------------------------------------------
class RolUsuario(str, enum.Enum):
    voluntario = "voluntario"
    organizacion = "organizacion"
    administrador = "administrador"


class RolMiembro(str, enum.Enum):
    administrador = "administrador"
    coordinador = "coordinador"


class TipoOrganizacion(str, enum.Enum):
    fundacion = "fundacion"
    odv = "odv"
    junta_accion_comunal = "junta_accion_comunal"
    entidad_publica = "entidad_publica"
    organismo_socorro = "organismo_socorro"
    empresa = "empresa"
    universidad = "universidad"
    otra = "otra"


class EstadoVerificacion(str, enum.Enum):
    pendiente = "pendiente"
    verificada = "verificada"
    rechazada = "rechazada"


class CategoriaHabilidad(str, enum.Enum):
    salud = "salud"
    logistica = "logistica"
    construccion = "construccion"
    psicosocial = "psicosocial"
    alimentacion = "alimentacion"
    transporte = "transporte"
    comunicacion = "comunicacion"
    cuidado = "cuidado"
    general = "general"


class FranjaHoraria(str, enum.Enum):
    manana = "manana"
    tarde = "tarde"
    noche = "noche"


class TipoEmergencia(str, enum.Enum):
    inundacion = "inundacion"
    sismo = "sismo"
    tormenta = "tormenta"
    deslizamiento = "deslizamiento"
    incendio = "incendio"
    otra = "otra"


class EstadoEmergencia(str, enum.Enum):
    por_confirmar = "por_confirmar"
    activa = "activa"
    cerrada = "cerrada"
    rechazada = "rechazada"


class TipoPunto(str, enum.Enum):
    centro_acopio = "centro_acopio"
    albergue = "albergue"
    banco_sangre = "banco_sangre"
    comedor = "comedor"
    puesto_salud = "puesto_salud"
    otro = "otro"


class TipoConvocatoria(str, enum.Enum):
    normal = "normal"
    prioritaria = "prioritaria"
    desastre = "desastre"


class EstadoConvocatoria(str, enum.Enum):
    borrador = "borrador"
    publicada = "publicada"
    cubierta = "cubierta"
    cerrada = "cerrada"
    cancelada = "cancelada"


class OrigenParticipacion(str, enum.Enum):
    postulacion = "postulacion"
    invitacion = "invitacion"
    convocatoria = "convocatoria"


class EstadoParticipacion(str, enum.Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"
    en_camino = "en_camino"
    no_puede = "no_puede"
    rechazado = "rechazado"
    cancelado = "cancelado"


class CanalNotificacion(str, enum.Enum):
    push = "push"
    correo = "correo"
    sms = "sms"


class EstadoNotificacion(str, enum.Enum):
    encolada = "encolada"
    enviada = "enviada"
    fallida = "fallida"
    leida = "leida"


def pg_enum(py_enum: type[enum.Enum], nombre: str) -> ENUM:
    """Usa el tipo ya creado en PostgreSQL sin intentar crearlo de nuevo."""
    return ENUM(
        py_enum,
        name=nombre,
        schema=ESQUEMA,
        create_type=False,
        values_callable=lambda e: [m.value for m in e],
    )


TS = TIMESTAMP(timezone=True)
AHORA = text("now()")


# ---------------------------------------------------------------------------
# Usuarios y consentimiento
# ---------------------------------------------------------------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nombre: Mapped[str] = mapped_column(Text)
    correo: Mapped[str] = mapped_column(CITEXT, unique=True)
    telefono: Mapped[str | None] = mapped_column(Text)
    hash_contrasena: Mapped[str] = mapped_column(Text)
    rol: Mapped[RolUsuario] = mapped_column(pg_enum(RolUsuario, "rol_usuario"))
    activo: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    anonimizado_en: Mapped[datetime | None] = mapped_column(TS)
    ultimo_acceso: Mapped[datetime | None] = mapped_column(TS)
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    actualizado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    # passive_deletes: al borrar un usuario, PostgreSQL elimina en cascada (ON DELETE CASCADE)
    voluntario: Mapped["Voluntario | None"] = relationship(
        back_populates="usuario", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )
    consentimientos: Mapped[list["Consentimiento"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan", passive_deletes=True
    )
    membresias: Mapped[list["OrganizacionMiembro"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan", passive_deletes=True
    )


class Consentimiento(Base):
    __tablename__ = "consentimientos"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    version_politica: Mapped[str] = mapped_column(Text)
    finalidades: Mapped[list[str]] = mapped_column(ARRAY(Text))
    otorgado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    revocado_en: Mapped[datetime | None] = mapped_column(TS)

    usuario: Mapped[Usuario] = relationship(back_populates="consentimientos")


# ---------------------------------------------------------------------------
# Habilidades y voluntarios
# ---------------------------------------------------------------------------
class Habilidad(Base):
    __tablename__ = "habilidades"

    id: Mapped[int] = mapped_column(SmallInteger, Identity(always=True), primary_key=True)
    nombre: Mapped[str] = mapped_column(Text, unique=True)
    categoria: Mapped[CategoriaHabilidad] = mapped_column(pg_enum(CategoriaHabilidad, "categoria_habilidad"))
    requiere_certificado: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    descripcion: Mapped[str | None] = mapped_column(Text)


class Voluntario(Base):
    __tablename__ = "voluntarios"

    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    codigo: Mapped[str] = mapped_column(Text, unique=True)
    barrio: Mapped[str] = mapped_column(Text)
    municipio: Mapped[str] = mapped_column(Text)
    codigo_divipola: Mapped[str | None] = mapped_column(Text)
    lat_aprox: Mapped[Decimal] = mapped_column(Numeric(5, 2))   # ~1,1 km: nunca la ubicación exacta
    lon_aprox: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    radio_km: Mapped[Decimal] = mapped_column(Numeric(4, 1), server_default=text("5"))
    recibir_convocatorias: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    acepta_emergencias: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    solo_emergencias: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    actualizado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    usuario: Mapped[Usuario] = relationship(back_populates="voluntario")
    habilidades: Mapped[list["VoluntarioHabilidad"]] = relationship(
        back_populates="voluntario", cascade="all, delete-orphan", passive_deletes=True
    )
    disponibilidades: Mapped[list["Disponibilidad"]] = relationship(
        back_populates="voluntario", cascade="all, delete-orphan", passive_deletes=True
    )


class VoluntarioHabilidad(Base):
    __tablename__ = "voluntario_habilidades"

    voluntario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("voluntarios.usuario_id", ondelete="CASCADE"), primary_key=True
    )
    habilidad_id: Mapped[int] = mapped_column(ForeignKey("habilidades.id"), primary_key=True)
    certificado_verificado: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))

    voluntario: Mapped[Voluntario] = relationship(back_populates="habilidades")
    habilidad: Mapped[Habilidad] = relationship(lazy="joined")


class Disponibilidad(Base):
    __tablename__ = "disponibilidades"

    voluntario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("voluntarios.usuario_id", ondelete="CASCADE"), primary_key=True
    )
    dia_semana: Mapped[int] = mapped_column(SmallInteger, primary_key=True)  # 1 = lunes … 7 = domingo
    franja: Mapped[FranjaHoraria] = mapped_column(pg_enum(FranjaHoraria, "franja_horaria"), primary_key=True)

    voluntario: Mapped[Voluntario] = relationship(back_populates="disponibilidades")


# ---------------------------------------------------------------------------
# Organizaciones
# ---------------------------------------------------------------------------
class Organizacion(Base):
    __tablename__ = "organizaciones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nombre: Mapped[str] = mapped_column(Text)
    nit: Mapped[str] = mapped_column(Text, unique=True)
    tipo: Mapped[TipoOrganizacion] = mapped_column(pg_enum(TipoOrganizacion, "tipo_organizacion"))
    estado_verificacion: Mapped[EstadoVerificacion] = mapped_column(
        pg_enum(EstadoVerificacion, "estado_verificacion"), server_default=text("'pendiente'")
    )
    verificada_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"))
    verificada_en: Mapped[datetime | None] = mapped_column(TS)
    correo: Mapped[str] = mapped_column(CITEXT)
    telefono: Mapped[str | None] = mapped_column(Text)
    barrio: Mapped[str | None] = mapped_column(Text)
    municipio: Mapped[str] = mapped_column(Text)
    codigo_divipola: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(8, 5))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(8, 5))
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    actualizado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    miembros: Mapped[list["OrganizacionMiembro"]] = relationship(
        back_populates="organizacion", cascade="all, delete-orphan", passive_deletes=True
    )


class OrganizacionMiembro(Base):
    __tablename__ = "organizacion_miembros"

    organizacion_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizaciones.id", ondelete="CASCADE"), primary_key=True
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    rol: Mapped[RolMiembro] = mapped_column(pg_enum(RolMiembro, "rol_miembro"), server_default=text("'coordinador'"))
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    organizacion: Mapped[Organizacion] = relationship(back_populates="miembros")
    usuario: Mapped[Usuario] = relationship(back_populates="membresias")


# ---------------------------------------------------------------------------
# Modo Emergencia
# ---------------------------------------------------------------------------
class Emergencia(Base):
    __tablename__ = "emergencias"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    tipo: Mapped[TipoEmergencia] = mapped_column(pg_enum(TipoEmergencia, "tipo_emergencia"))
    titulo: Mapped[str] = mapped_column(Text)
    descripcion: Mapped[str | None] = mapped_column(Text)
    centro_lat: Mapped[Decimal] = mapped_column(Numeric(8, 5))
    centro_lon: Mapped[Decimal] = mapped_column(Numeric(8, 5))
    radio_km: Mapped[Decimal] = mapped_column(Numeric(5, 1), server_default=text("5"))
    municipio: Mapped[str] = mapped_column(Text)
    estado: Mapped[EstadoEmergencia] = mapped_column(
        pg_enum(EstadoEmergencia, "estado_emergencia"), server_default=text("'por_confirmar'")
    )
    solicitada_por: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizaciones.id"))
    solicitada_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    confirmada_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"))
    activada_en: Mapped[datetime | None] = mapped_column(TS)
    cerrada_en: Mapped[datetime | None] = mapped_column(TS)

    puntos: Mapped[list["PuntoOperacion"]] = relationship(back_populates="emergencia")


class PuntoOperacion(Base):
    __tablename__ = "puntos_operacion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    emergencia_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("emergencias.id", ondelete="CASCADE"))
    organizacion_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizaciones.id"))
    tipo: Mapped[TipoPunto] = mapped_column(pg_enum(TipoPunto, "tipo_punto"))
    nombre: Mapped[str] = mapped_column(Text)
    direccion: Mapped[str] = mapped_column(Text)
    lat: Mapped[Decimal] = mapped_column(Numeric(8, 5))
    lon: Mapped[Decimal] = mapped_column(Numeric(8, 5))
    horario: Mapped[str | None] = mapped_column(Text)
    publico: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    activo: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    emergencia: Mapped[Emergencia | None] = relationship(back_populates="puntos")


# ---------------------------------------------------------------------------
# Convocatorias y participación
# ---------------------------------------------------------------------------
class Convocatoria(Base):
    __tablename__ = "convocatorias"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    organizacion_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizaciones.id"))
    creada_por: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"))
    tipo: Mapped[TipoConvocatoria] = mapped_column(
        pg_enum(TipoConvocatoria, "tipo_convocatoria"), server_default=text("'normal'")
    )
    emergencia_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("emergencias.id"))
    punto_operacion_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("puntos_operacion.id"))
    titulo: Mapped[str] = mapped_column(Text)
    descripcion: Mapped[str | None] = mapped_column(Text)
    indicaciones: Mapped[str | None] = mapped_column(Text)
    direccion: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[Decimal] = mapped_column(Numeric(8, 5))
    lon: Mapped[Decimal] = mapped_column(Numeric(8, 5))
    radio_km: Mapped[Decimal] = mapped_column(Numeric(4, 1), server_default=text("5"))
    inicio: Mapped[datetime] = mapped_column(TS)
    fin: Mapped[datetime] = mapped_column(TS)
    cupos: Mapped[int] = mapped_column(SmallInteger)
    estado: Mapped[EstadoConvocatoria] = mapped_column(
        pg_enum(EstadoConvocatoria, "estado_convocatoria"), server_default=text("'borrador'")
    )
    publicada_en: Mapped[datetime | None] = mapped_column(TS)
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    actualizado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    habilidades: Mapped[list["ConvocatoriaHabilidad"]] = relationship(
        back_populates="convocatoria", cascade="all, delete-orphan", lazy="selectin"
    )
    participaciones: Mapped[list["Participacion"]] = relationship(
        back_populates="convocatoria", cascade="all, delete-orphan"
    )


class ConvocatoriaHabilidad(Base):
    __tablename__ = "convocatoria_habilidades"

    convocatoria_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("convocatorias.id", ondelete="CASCADE"), primary_key=True
    )
    habilidad_id: Mapped[int] = mapped_column(ForeignKey("habilidades.id"), primary_key=True)

    convocatoria: Mapped[Convocatoria] = relationship(back_populates="habilidades")
    habilidad: Mapped[Habilidad] = relationship(lazy="joined")


class Participacion(Base):
    __tablename__ = "participaciones"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    convocatoria_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("convocatorias.id", ondelete="CASCADE"))
    voluntario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("voluntarios.usuario_id", ondelete="CASCADE"))
    alias: Mapped[str] = mapped_column(Text)            # «A12»: lo único que ve la organización
    origen: Mapped[OrigenParticipacion] = mapped_column(pg_enum(OrigenParticipacion, "origen_participacion"))
    estado: Mapped[EstadoParticipacion] = mapped_column(
        pg_enum(EstadoParticipacion, "estado_participacion"), server_default=text("'pendiente'")
    )
    puntaje: Mapped[Decimal | None] = mapped_column(Numeric(4, 3))
    distancia_km: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    detalle: Mapped[str | None] = mapped_column(Text)
    notificado_en: Mapped[datetime | None] = mapped_column(TS)
    respondido_en: Mapped[datetime | None] = mapped_column(TS)
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)

    convocatoria: Mapped[Convocatoria] = relationship(back_populates="participaciones")
    asistencia: Mapped["Asistencia | None"] = relationship(back_populates="participacion", uselist=False)


class Asistencia(Base):
    __tablename__ = "asistencias"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    participacion_id: Mapped[int] = mapped_column(
        ForeignKey("participaciones.id", ondelete="CASCADE"), unique=True
    )
    check_in: Mapped[datetime] = mapped_column(TS)
    check_out: Mapped[datetime | None] = mapped_column(TS)
    registrado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"))
    # Columna calculada por PostgreSQL: nunca se escribe desde Python
    horas: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        Computed("round((extract(epoch from (check_out - check_in)) / 3600)::numeric, 2)", persisted=True),
    )

    participacion: Mapped[Participacion] = relationship(back_populates="asistencia")


# ---------------------------------------------------------------------------
# Notificaciones y auditoría
# ---------------------------------------------------------------------------
class Notificacion(Base):
    __tablename__ = "notificaciones"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    convocatoria_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("convocatorias.id", ondelete="CASCADE"))
    canal: Mapped[CanalNotificacion] = mapped_column(pg_enum(CanalNotificacion, "canal_notificacion"))
    estado: Mapped[EstadoNotificacion] = mapped_column(
        pg_enum(EstadoNotificacion, "estado_notificacion"), server_default=text("'encolada'")
    )
    titulo: Mapped[str] = mapped_column(Text)
    cuerpo: Mapped[str] = mapped_column(Text)
    intentos: Mapped[int] = mapped_column(SmallInteger, server_default=text("0"))
    encolada_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
    enviada_en: Mapped[datetime | None] = mapped_column(TS)
    leida_en: Mapped[datetime | None] = mapped_column(TS)


class Auditoria(Base):
    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    tabla: Mapped[str] = mapped_column(Text)
    registro_id: Mapped[str] = mapped_column(Text)
    accion: Mapped[str] = mapped_column(Text)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"))
    datos: Mapped[dict | None] = mapped_column(JSONB)
    creado_en: Mapped[datetime] = mapped_column(TS, server_default=AHORA)
