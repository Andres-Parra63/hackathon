"""Autenticación JWT y permisos por rol.

  * POST /auth/login  -> token de corta duración (por defecto 8 h).
  * usuario_actual    -> dependencia que lee «Authorization: Bearer <token>».
  * requiere_rol(...) -> dependencia que además exige uno de los roles dados.

El secreto sale de la variable de entorno JWT_SECRET (nunca en el código).
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models as m
from db import get_db

ALGORITMO = "HS256"
DURACION_HORAS = int(os.getenv("JWT_HORAS", "8"))

# Sin JWT_SECRET los tokens no sobreviven a un reinicio: sirve para desarrollo, no para producción.
_SECRETO = os.getenv("JWT_SECRET") or os.urandom(32).hex()

_esquema = HTTPBearer(auto_error=False)


def crear_token(usuario: m.Usuario) -> str:
    ahora = datetime.now(timezone.utc)
    carga = {
        "sub": str(usuario.id),
        "rol": usuario.rol.value,
        "iat": ahora,
        "exp": ahora + timedelta(hours=DURACION_HORAS),
    }
    return jwt.encode(carga, _SECRETO, algorithm=ALGORITMO)


def usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema),
    db: Session = Depends(get_db),
) -> m.Usuario:
    no_autorizado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Inicia sesión para continuar",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credenciales is None:
        raise no_autorizado
    try:
        carga = jwt.decode(credenciales.credentials, _SECRETO, algorithms=[ALGORITMO])
        usuario = db.get(m.Usuario, uuid.UUID(carga["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise no_autorizado
    if usuario is None or not usuario.activo:
        raise no_autorizado
    return usuario


def requiere_rol(*roles: m.RolUsuario):
    """Dependencia de FastAPI: 403 si el usuario no tiene uno de los roles."""

    def comprobar(usuario: m.Usuario = Depends(usuario_actual)) -> m.Usuario:
        if usuario.rol not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para esta acción")
        return usuario

    return comprobar


def es_el_mismo_o_admin(usuario: m.Usuario, usuario_id: uuid.UUID) -> None:
    """Un voluntario solo puede tocar sus propios datos; el administrador, los de cualquiera."""
    if usuario.id != usuario_id and usuario.rol != m.RolUsuario.administrador:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo puedes acceder a tus propios datos")
