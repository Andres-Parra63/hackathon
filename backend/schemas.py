"""Esquemas Pydantic v2: validan lo que entra y sale de la API.

Convención: *Crear* (entrada al crear), *Actualizar* (cambios parciales,
todos los campos opcionales) y *Salida* (lo que devuelve la API).
"""
import uuid
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from models import (
    CategoriaHabilidad,
    EstadoConvocatoria,
    EstadoEmergencia,
    EstadoParticipacion,
    EstadoVerificacion,
    FranjaHoraria,
    TipoConvocatoria,
    TipoEmergencia,
    TipoOrganizacion,
    TipoPunto,
)

DOS_DECIMALES = Decimal("0.01")


def _aproximar(valor: Decimal | float | None) -> Decimal | None:
    """Redondea la coordenada a ~1 km (privacidad desde el diseño, RNF-06)."""
    if valor is None:
        return None
    return Decimal(str(valor)).quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)


class Salida(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Habilidades
# ---------------------------------------------------------------------------
class HabilidadCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    categoria: CategoriaHabilidad
    requiere_certificado: bool = False
    descripcion: str | None = None


class HabilidadActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=60)
    categoria: CategoriaHabilidad | None = None
    requiere_certificado: bool | None = None
    descripcion: str | None = None


class HabilidadSalida(Salida):
    id: int
    nombre: str
    categoria: CategoriaHabilidad
    requiere_certificado: bool
    descripcion: str | None = None


# ---------------------------------------------------------------------------
# Voluntarios
# ---------------------------------------------------------------------------
class DisponibilidadEntrada(BaseModel):
    dia_semana: int = Field(ge=1, le=7, description="1 = lunes … 7 = domingo")
    franja: FranjaHoraria


class VoluntarioCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    correo: EmailStr
    telefono: str | None = Field(default=None, pattern=r"^[0-9 +()-]{7,20}$")
    contrasena: str = Field(min_length=8, max_length=128)
    barrio: str
    municipio: str
    codigo_divipola: str | None = Field(default=None, min_length=5, max_length=5)
    lat: Decimal = Field(ge=-90, le=90, description="Se guarda redondeada a ~1 km")
    lon: Decimal = Field(ge=-180, le=180)
    radio_km: Decimal = Field(default=Decimal("5"), ge=1, le=50)
    acepta_emergencias: bool = True
    solo_emergencias: bool = False
    habilidad_ids: list[int] = Field(min_length=1)
    disponibilidades: list[DisponibilidadEntrada] = Field(default_factory=list)
    acepta_tratamiento_datos: bool = Field(description="Autorización Ley 1581 de 2012; debe ser true")

    @field_validator("lat", "lon")
    @classmethod
    def _redondear(cls, v: Decimal) -> Decimal:
        return _aproximar(v)

    @field_validator("acepta_tratamiento_datos")
    @classmethod
    def _consentimiento(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Se requiere la autorización de tratamiento de datos (Ley 1581 de 2012)")
        return v


class VoluntarioActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    telefono: str | None = Field(default=None, pattern=r"^[0-9 +()-]{7,20}$")
    barrio: str | None = None
    municipio: str | None = None
    lat: Decimal | None = Field(default=None, ge=-90, le=90)
    lon: Decimal | None = Field(default=None, ge=-180, le=180)
    radio_km: Decimal | None = Field(default=None, ge=1, le=50)
    recibir_convocatorias: bool | None = None
    acepta_emergencias: bool | None = None
    solo_emergencias: bool | None = None
    habilidad_ids: list[int] | None = Field(default=None, min_length=1)
    disponibilidades: list[DisponibilidadEntrada] | None = None

    @field_validator("lat", "lon")
    @classmethod
    def _redondear(cls, v: Decimal | None) -> Decimal | None:
        return _aproximar(v)


class DisponibilidadSalida(Salida):
    dia_semana: int
    franja: FranjaHoraria


class VoluntarioSalida(Salida):
    usuario_id: uuid.UUID
    codigo: str
    nombre: str
    correo: str
    barrio: str
    municipio: str
    lat_aprox: Decimal
    lon_aprox: Decimal
    radio_km: Decimal
    recibir_convocatorias: bool
    acepta_emergencias: bool
    solo_emergencias: bool
    habilidades: list[HabilidadSalida]
    disponibilidades: list[DisponibilidadSalida]


# ---------------------------------------------------------------------------
# Organizaciones
# ---------------------------------------------------------------------------
class OrganizacionCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=160)
    nit: str = Field(pattern=r"^[0-9]{6,12}-?[0-9]?$")
    tipo: TipoOrganizacion
    correo: EmailStr
    telefono: str | None = None
    barrio: str | None = None
    municipio: str
    codigo_divipola: str | None = Field(default=None, min_length=5, max_length=5)
    lat: Decimal | None = Field(default=None, ge=-90, le=90)
    lon: Decimal | None = Field(default=None, ge=-180, le=180)
    # Persona que administra la cuenta de la organización
    responsable_nombre: str = Field(min_length=2, max_length=120)
    responsable_correo: EmailStr
    responsable_contrasena: str = Field(min_length=8, max_length=128)
    acepta_tratamiento_datos: bool

    @field_validator("acepta_tratamiento_datos")
    @classmethod
    def _consentimiento(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Se requiere la autorización de tratamiento de datos (Ley 1581 de 2012)")
        return v


class OrganizacionActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=160)
    tipo: TipoOrganizacion | None = None
    correo: EmailStr | None = None
    telefono: str | None = None
    barrio: str | None = None
    municipio: str | None = None
    lat: Decimal | None = Field(default=None, ge=-90, le=90)
    lon: Decimal | None = Field(default=None, ge=-180, le=180)


class OrganizacionSalida(Salida):
    id: uuid.UUID
    nombre: str
    nit: str
    tipo: TipoOrganizacion
    estado_verificacion: EstadoVerificacion
    correo: str
    telefono: str | None = None
    barrio: str | None = None
    municipio: str
    lat: Decimal | None = None
    lon: Decimal | None = None
    creado_en: datetime


class VerificacionEntrada(BaseModel):
    administrador_id: uuid.UUID
    aprobar: bool


# ---------------------------------------------------------------------------
# Emergencias y puntos de operación
# ---------------------------------------------------------------------------
class EmergenciaCrear(BaseModel):
    tipo: TipoEmergencia
    titulo: str = Field(min_length=3, max_length=160)
    descripcion: str | None = None
    centro_lat: Decimal = Field(ge=-90, le=90)
    centro_lon: Decimal = Field(ge=-180, le=180)
    radio_km: Decimal = Field(default=Decimal("5"), ge=Decimal("0.5"), le=200)
    municipio: str


class EmergenciaSalida(Salida):
    id: uuid.UUID
    tipo: TipoEmergencia
    titulo: str
    descripcion: str | None = None
    centro_lat: Decimal
    centro_lon: Decimal
    radio_km: Decimal
    municipio: str
    estado: EstadoEmergencia
    solicitada_por: uuid.UUID
    solicitada_en: datetime
    activada_en: datetime | None = None
    cerrada_en: datetime | None = None


class PuntoCrear(BaseModel):
    emergencia_id: uuid.UUID | None = None
    tipo: TipoPunto
    nombre: str = Field(min_length=2, max_length=160)
    direccion: str
    lat: Decimal = Field(ge=-90, le=90)
    lon: Decimal = Field(ge=-180, le=180)
    horario: str | None = None
    publico: bool = True


class PuntoActualizar(BaseModel):
    nombre: str | None = None
    direccion: str | None = None
    horario: str | None = None
    publico: bool | None = None
    activo: bool | None = None


class PuntoSalida(Salida):
    id: uuid.UUID
    emergencia_id: uuid.UUID | None = None
    organizacion_id: uuid.UUID
    tipo: TipoPunto
    nombre: str
    direccion: str
    lat: Decimal
    lon: Decimal
    horario: str | None = None
    publico: bool
    activo: bool


# ---------------------------------------------------------------------------
# Convocatorias
# ---------------------------------------------------------------------------
class ConvocatoriaCrear(BaseModel):
    creada_por: uuid.UUID
    tipo: TipoConvocatoria = TipoConvocatoria.normal
    emergencia_id: uuid.UUID | None = None
    punto_operacion_id: uuid.UUID | None = None
    titulo: str = Field(min_length=3, max_length=160)
    descripcion: str | None = None
    indicaciones: str | None = None
    direccion: str | None = None
    lat: Decimal = Field(ge=-90, le=90)
    lon: Decimal = Field(ge=-180, le=180)
    radio_km: Decimal = Field(default=Decimal("5"), ge=Decimal("0.5"), le=50)
    inicio: datetime
    fin: datetime
    cupos: int = Field(gt=0, le=1000)
    habilidad_ids: list[int] = Field(min_length=1)
    publicar: bool = False

    @model_validator(mode="after")
    def _coherencia(self) -> "ConvocatoriaCrear":
        if self.fin <= self.inicio:
            raise ValueError("La hora de fin debe ser posterior a la de inicio")
        if self.tipo == TipoConvocatoria.desastre and self.emergencia_id is None:
            raise ValueError("Una convocatoria de desastre necesita una emergencia activa")
        return self


class ConvocatoriaActualizar(BaseModel):
    titulo: str | None = Field(default=None, min_length=3, max_length=160)
    descripcion: str | None = None
    indicaciones: str | None = None
    direccion: str | None = None
    radio_km: Decimal | None = Field(default=None, ge=Decimal("0.5"), le=50)
    inicio: datetime | None = None
    fin: datetime | None = None
    cupos: int | None = Field(default=None, gt=0, le=1000)
    habilidad_ids: list[int] | None = Field(default=None, min_length=1)


class ConvocatoriaSalida(Salida):
    id: uuid.UUID
    organizacion_id: uuid.UUID
    tipo: TipoConvocatoria
    emergencia_id: uuid.UUID | None = None
    punto_operacion_id: uuid.UUID | None = None
    titulo: str
    descripcion: str | None = None
    indicaciones: str | None = None
    direccion: str | None = None
    lat: Decimal
    lon: Decimal
    radio_km: Decimal
    inicio: datetime
    fin: datetime
    cupos: int
    estado: EstadoConvocatoria
    publicada_en: datetime | None = None
    habilidades: list[HabilidadSalida]

    @field_validator("habilidades", mode="before")
    @classmethod
    def _aplanar(cls, v):
        # ConvocatoriaHabilidad → Habilidad
        return [getattr(x, "habilidad", x) for x in v]


class ResumenConvocatoria(Salida):
    id: uuid.UUID
    titulo: str
    tipo: TipoConvocatoria
    estado: EstadoConvocatoria
    cupos: int
    convocados: int
    confirmados: int
    no_pueden: int
    sin_respuesta: int
    porcentaje_cubierto: Decimal


class Candidato(Salida):
    voluntario_id: uuid.UUID
    distancia_km: Decimal
    habilidades_coinciden: int
    habilidades_requeridas: int
    disponible: bool
    puntaje: Decimal


class Embudo(Salida):
    en_radio: int
    con_habilidad: int
    disponibles: int
    excluidos_por_habilidad: int
    excluidos_por_horario: int


# ---------------------------------------------------------------------------
# Participaciones y asistencia
# ---------------------------------------------------------------------------
class RespuestaEntrada(BaseModel):
    estado: EstadoParticipacion
    detalle: str | None = Field(default=None, max_length=200)

    @field_validator("estado")
    @classmethod
    def _no_pendiente(cls, v: EstadoParticipacion) -> EstadoParticipacion:
        if v == EstadoParticipacion.pendiente:
            raise ValueError("La respuesta no puede volver a «pendiente»")
        return v


class ParticipacionSalida(Salida):
    """Lo que ve la organización: alias anónimo, nunca nombre ni teléfono."""

    id: int
    convocatoria_id: uuid.UUID
    alias: str
    estado: EstadoParticipacion
    distancia_km: Decimal | None = None
    puntaje: Decimal | None = None
    detalle: str | None = None
    notificado_en: datetime | None = None
    respondido_en: datetime | None = None


class AsistenciaSalida(Salida):
    id: int
    participacion_id: int
    check_in: datetime
    check_out: datetime | None = None
    horas: Decimal | None = None
