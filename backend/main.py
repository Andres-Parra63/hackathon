"""API de Manos en Red (FastAPI). Ejecutar con:
    uvicorn main:app --reload   (desde la carpeta backend)
Documentación interactiva: http://localhost:8000/docs
"""
import uuid

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

import crud
import models as m
import schemas as s
from db import get_db

app = FastAPI(title="Manos en Red API", version="0.1.0")

# El frontend de React (Vite) corre en el puerto 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MENSAJES_SQL = {
    "23505": "Ya existe un registro con esos datos (correo, NIT o código repetido)",
    "23503": "El registro está relacionado con otros datos y no se puede completar la operación",
}


@app.exception_handler(DBAPIError)
async def error_base_datos(request: Request, exc: DBAPIError):
    """Convierte las reglas de negocio de PostgreSQL en respuestas 409 legibles."""
    estado_sql = getattr(exc.orig, "sqlstate", None) or getattr(exc.orig, "pgcode", None)
    diagnostico = getattr(exc.orig, "diag", None)
    detalle = MENSAJES_SQL.get(estado_sql) or (diagnostico.message_primary if diagnostico else str(exc.orig))
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": detalle})


@app.exception_handler(ValueError)
async def error_valor(request: Request, exc: ValueError):
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


def _o_404(objeto, nombre: str):
    if objeto is None:
        raise HTTPException(status_code=404, detail=f"{nombre} no encontrado")
    return objeto


def _voluntario_salida(v: m.Voluntario) -> s.VoluntarioSalida:
    return s.VoluntarioSalida(
        usuario_id=v.usuario_id,
        codigo=v.codigo,
        nombre=v.usuario.nombre,
        correo=v.usuario.correo,
        barrio=v.barrio,
        municipio=v.municipio,
        lat_aprox=v.lat_aprox,
        lon_aprox=v.lon_aprox,
        radio_km=v.radio_km,
        recibir_convocatorias=v.recibir_convocatorias,
        acepta_emergencias=v.acepta_emergencias,
        solo_emergencias=v.solo_emergencias,
        habilidades=[s.HabilidadSalida.model_validate(vh.habilidad) for vh in v.habilidades],
        disponibilidades=[s.DisponibilidadSalida.model_validate(d) for d in v.disponibilidades],
    )


@app.get("/", tags=["estado"])
def inicio():
    return {"app": "Manos en Red", "documentacion": "/docs"}


# --------------------------------------------------------------------------- Habilidades
@app.get("/habilidades", response_model=list[s.HabilidadSalida], tags=["habilidades"])
def listar_habilidades(db: Session = Depends(get_db)):
    return crud.listar_habilidades(db)


@app.post("/habilidades", response_model=s.HabilidadSalida, status_code=201, tags=["habilidades"])
def crear_habilidad(datos: s.HabilidadCrear, db: Session = Depends(get_db)):
    return crud.crear_habilidad(db, datos)


@app.patch("/habilidades/{habilidad_id}", response_model=s.HabilidadSalida, tags=["habilidades"])
def actualizar_habilidad(habilidad_id: int, datos: s.HabilidadActualizar, db: Session = Depends(get_db)):
    return _o_404(crud.actualizar_habilidad(db, habilidad_id, datos), "Habilidad")


@app.delete("/habilidades/{habilidad_id}", status_code=204, tags=["habilidades"])
def eliminar_habilidad(habilidad_id: int, db: Session = Depends(get_db)):
    _o_404(crud.eliminar_habilidad(db, habilidad_id) or None, "Habilidad")


# --------------------------------------------------------------------------- Voluntarios
@app.post("/voluntarios", response_model=s.VoluntarioSalida, status_code=201, tags=["voluntarios"])
def registrar_voluntario(datos: s.VoluntarioCrear, db: Session = Depends(get_db)):
    return _voluntario_salida(crud.crear_voluntario(db, datos))


@app.get("/voluntarios", response_model=list[s.VoluntarioSalida], tags=["voluntarios"])
def listar_voluntarios(municipio: str | None = None, habilidad_id: int | None = None,
                       saltar: int = 0, limite: int = 50, db: Session = Depends(get_db)):
    return [_voluntario_salida(v) for v in crud.listar_voluntarios(db, municipio, habilidad_id, saltar, limite)]


@app.get("/voluntarios/{usuario_id}", response_model=s.VoluntarioSalida, tags=["voluntarios"])
def obtener_voluntario(usuario_id: uuid.UUID, db: Session = Depends(get_db)):
    return _voluntario_salida(_o_404(crud.obtener_voluntario(db, usuario_id), "Voluntario"))


@app.patch("/voluntarios/{usuario_id}", response_model=s.VoluntarioSalida, tags=["voluntarios"])
def actualizar_voluntario(usuario_id: uuid.UUID, datos: s.VoluntarioActualizar, db: Session = Depends(get_db)):
    return _voluntario_salida(_o_404(crud.actualizar_voluntario(db, usuario_id, datos), "Voluntario"))


@app.delete("/voluntarios/{usuario_id}", status_code=204, tags=["voluntarios"])
def eliminar_voluntario(usuario_id: uuid.UUID, db: Session = Depends(get_db)):
    _o_404(crud.eliminar_usuario(db, usuario_id) or None, "Voluntario")


@app.post("/usuarios/{usuario_id}/revocar-consentimiento", status_code=204, tags=["voluntarios"])
def revocar_consentimiento(usuario_id: uuid.UUID, db: Session = Depends(get_db)):
    _o_404(crud.revocar_consentimiento(db, usuario_id) or None, "Consentimiento vigente")


@app.get("/voluntarios/{usuario_id}/horas", tags=["voluntarios"])
def horas(usuario_id: uuid.UUID, db: Session = Depends(get_db)):
    return crud.horas_voluntario(db, usuario_id)


@app.get("/voluntarios/{usuario_id}/convocatorias-cercanas",
         response_model=list[s.ConvocatoriaSalida], tags=["voluntarios"])
def convocatorias_cercanas(usuario_id: uuid.UUID, db: Session = Depends(get_db)):
    return crud.listar_convocatorias_cercanas(db, usuario_id)


# --------------------------------------------------------------------------- Organizaciones
@app.post("/organizaciones", response_model=s.OrganizacionSalida, status_code=201, tags=["organizaciones"])
def registrar_organizacion(datos: s.OrganizacionCrear, db: Session = Depends(get_db)):
    return crud.crear_organizacion(db, datos)


@app.get("/organizaciones", response_model=list[s.OrganizacionSalida], tags=["organizaciones"])
def listar_organizaciones(estado: m.EstadoVerificacion | None = None, saltar: int = 0, limite: int = 50,
                          db: Session = Depends(get_db)):
    return crud.listar_organizaciones(db, estado, saltar, limite)


@app.get("/organizaciones/{organizacion_id}", response_model=s.OrganizacionSalida, tags=["organizaciones"])
def obtener_organizacion(organizacion_id: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.obtener_organizacion(db, organizacion_id), "Organización")


@app.patch("/organizaciones/{organizacion_id}", response_model=s.OrganizacionSalida, tags=["organizaciones"])
def actualizar_organizacion(organizacion_id: uuid.UUID, datos: s.OrganizacionActualizar,
                            db: Session = Depends(get_db)):
    return _o_404(crud.actualizar_organizacion(db, organizacion_id, datos), "Organización")


@app.post("/organizaciones/{organizacion_id}/verificacion", response_model=s.OrganizacionSalida,
          tags=["organizaciones"])
def verificar_organizacion(organizacion_id: uuid.UUID, datos: s.VerificacionEntrada,
                           db: Session = Depends(get_db)):
    return _o_404(crud.verificar_organizacion(db, organizacion_id, datos.administrador_id, datos.aprobar),
                  "Organización")


@app.delete("/organizaciones/{organizacion_id}", status_code=204, tags=["organizaciones"])
def eliminar_organizacion(organizacion_id: uuid.UUID, db: Session = Depends(get_db)):
    _o_404(crud.eliminar_organizacion(db, organizacion_id) or None, "Organización")


# --------------------------------------------------------------------------- Modo Emergencia
@app.post("/organizaciones/{organizacion_id}/emergencias", response_model=s.EmergenciaSalida,
          status_code=201, tags=["emergencias"])
def solicitar_emergencia(organizacion_id: uuid.UUID, datos: s.EmergenciaCrear, db: Session = Depends(get_db)):
    return crud.solicitar_emergencia(db, organizacion_id, datos)


@app.post("/emergencias/{emergencia_id}/confirmar", response_model=s.EmergenciaSalida, tags=["emergencias"])
def confirmar_emergencia(emergencia_id: uuid.UUID, confirmada_por: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.confirmar_emergencia(db, emergencia_id, confirmada_por), "Emergencia")


@app.post("/emergencias/{emergencia_id}/cerrar", response_model=s.EmergenciaSalida, tags=["emergencias"])
def cerrar_emergencia(emergencia_id: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.cerrar_emergencia(db, emergencia_id), "Emergencia")


@app.get("/emergencias", response_model=list[s.EmergenciaSalida], tags=["emergencias"])
def listar_emergencias(solo_activas: bool = True, db: Session = Depends(get_db)):
    return crud.listar_emergencias(db, solo_activas)


@app.get("/emergencias/{emergencia_id}", response_model=s.EmergenciaSalida, tags=["emergencias"])
def obtener_emergencia(emergencia_id: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.obtener_emergencia(db, emergencia_id), "Emergencia")


@app.post("/organizaciones/{organizacion_id}/puntos", response_model=s.PuntoSalida, status_code=201,
          tags=["puntos de operación"])
def crear_punto(organizacion_id: uuid.UUID, datos: s.PuntoCrear, db: Session = Depends(get_db)):
    return crud.crear_punto(db, organizacion_id, datos)


@app.get("/puntos", response_model=list[s.PuntoSalida], tags=["puntos de operación"])
def listar_puntos(emergencia_id: uuid.UUID | None = None, solo_publicos: bool = True,
                  db: Session = Depends(get_db)):
    """Mapa ciudadano (RF-09): por defecto solo los puntos públicos activos."""
    return crud.listar_puntos(db, emergencia_id, solo_publicos)


@app.patch("/puntos/{punto_id}", response_model=s.PuntoSalida, tags=["puntos de operación"])
def actualizar_punto(punto_id: uuid.UUID, datos: s.PuntoActualizar, db: Session = Depends(get_db)):
    return _o_404(crud.actualizar_punto(db, punto_id, datos), "Punto de operación")


@app.delete("/puntos/{punto_id}", status_code=204, tags=["puntos de operación"])
def desactivar_punto(punto_id: uuid.UUID, db: Session = Depends(get_db)):
    _o_404(crud.desactivar_punto(db, punto_id) or None, "Punto de operación")


# --------------------------------------------------------------------------- Convocatorias
@app.post("/organizaciones/{organizacion_id}/convocatorias", response_model=s.ConvocatoriaSalida,
          status_code=201, tags=["convocatorias"])
def crear_convocatoria(organizacion_id: uuid.UUID, datos: s.ConvocatoriaCrear, db: Session = Depends(get_db)):
    return crud.crear_convocatoria(db, organizacion_id, datos)


@app.get("/convocatorias", response_model=list[s.ConvocatoriaSalida], tags=["convocatorias"])
def listar_convocatorias(organizacion_id: uuid.UUID | None = None, estado: m.EstadoConvocatoria | None = None,
                         tipo: m.TipoConvocatoria | None = None, saltar: int = 0, limite: int = 50,
                         db: Session = Depends(get_db)):
    return crud.listar_convocatorias(db, organizacion_id, estado, tipo, saltar, limite)


@app.get("/convocatorias/{convocatoria_id}", response_model=s.ConvocatoriaSalida, tags=["convocatorias"])
def obtener_convocatoria(convocatoria_id: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.obtener_convocatoria(db, convocatoria_id), "Convocatoria")


@app.patch("/convocatorias/{convocatoria_id}", response_model=s.ConvocatoriaSalida, tags=["convocatorias"])
def actualizar_convocatoria(convocatoria_id: uuid.UUID, datos: s.ConvocatoriaActualizar,
                            db: Session = Depends(get_db)):
    return _o_404(crud.actualizar_convocatoria(db, convocatoria_id, datos), "Convocatoria")


@app.post("/convocatorias/{convocatoria_id}/estado/{nuevo}", response_model=s.ConvocatoriaSalida,
          tags=["convocatorias"])
def cambiar_estado(convocatoria_id: uuid.UUID, nuevo: m.EstadoConvocatoria, db: Session = Depends(get_db)):
    """publicada · cubierta («Marcar como cubierta») · cerrada · cancelada."""
    return _o_404(crud.cambiar_estado_convocatoria(db, convocatoria_id, nuevo), "Convocatoria")


@app.delete("/convocatorias/{convocatoria_id}", status_code=204, tags=["convocatorias"])
def eliminar_convocatoria(convocatoria_id: uuid.UUID, db: Session = Depends(get_db)):
    _o_404(crud.eliminar_convocatoria(db, convocatoria_id) or None, "Convocatoria")


@app.get("/convocatorias/{convocatoria_id}/resumen", response_model=s.ResumenConvocatoria,
         tags=["convocatorias"])
def resumen(convocatoria_id: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.resumen_convocatoria(db, convocatoria_id), "Convocatoria")


@app.get("/convocatorias/{convocatoria_id}/candidatos", response_model=list[s.Candidato],
         tags=["convocatorias"])
def candidatos(convocatoria_id: uuid.UUID, db: Session = Depends(get_db)):
    return crud.candidatos(db, convocatoria_id)


@app.get("/convocatorias/{convocatoria_id}/embudo", response_model=s.Embudo, tags=["convocatorias"])
def embudo(convocatoria_id: uuid.UUID, db: Session = Depends(get_db)):
    return _o_404(crud.embudo(db, convocatoria_id), "Convocatoria")


@app.post("/convocatorias/{convocatoria_id}/convocar", tags=["convocatorias"])
def convocar(convocatoria_id: uuid.UUID, limite: int | None = None, db: Session = Depends(get_db)):
    return {"convocados": crud.convocar(db, convocatoria_id, limite)}


# --------------------------------------------------------------------------- Participaciones
@app.post("/convocatorias/{convocatoria_id}/postulaciones", response_model=s.ParticipacionSalida,
          status_code=201, tags=["participaciones"])
def postularse(convocatoria_id: uuid.UUID, voluntario_id: uuid.UUID, db: Session = Depends(get_db)):
    return crud.postularse(db, convocatoria_id, voluntario_id)


@app.get("/convocatorias/{convocatoria_id}/participaciones", response_model=list[s.ParticipacionSalida],
         tags=["participaciones"])
def listar_participaciones(convocatoria_id: uuid.UUID, db: Session = Depends(get_db)):
    return crud.listar_participaciones(db, convocatoria_id)


@app.post("/participaciones/{participacion_id}/respuesta", response_model=s.ParticipacionSalida,
          tags=["participaciones"])
def responder(participacion_id: int, datos: s.RespuestaEntrada, db: Session = Depends(get_db)):
    return _o_404(crud.responder(db, participacion_id, datos), "Participación")


@app.post("/participaciones/{participacion_id}/cancelar", response_model=s.ParticipacionSalida,
          tags=["participaciones"])
def cancelar(participacion_id: int, db: Session = Depends(get_db)):
    return _o_404(crud.cancelar_participacion(db, participacion_id), "Participación")


@app.post("/participaciones/{participacion_id}/entrada", response_model=s.AsistenciaSalida,
          status_code=201, tags=["asistencia"])
def registrar_entrada(participacion_id: int, registrado_por: uuid.UUID | None = None,
                      db: Session = Depends(get_db)):
    return crud.registrar_entrada(db, participacion_id, registrado_por)


@app.post("/participaciones/{participacion_id}/salida", response_model=s.AsistenciaSalida,
          tags=["asistencia"])
def registrar_salida(participacion_id: int, db: Session = Depends(get_db)):
    return _o_404(crud.registrar_salida(db, participacion_id), "Asistencia")
