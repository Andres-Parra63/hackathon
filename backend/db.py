"""Conexión a PostgreSQL del proyecto Manos en Red.

Reemplaza la versión anterior de backend/db.py. Usa el mismo driver y los mismos datos que src/conexion.py (psycopg2, host,
usuario, contraseña y base HACKATON_DB), pero leídos desde el archivo .env
para que la contraseña nunca quede escrita en el código ni llegue a GitHub.

Ofrece dos formas de trabajar con la base:
  * SQLAlchemy (engine + SessionLocal + get_db): la usa crud.py y la API.
  * conexion_directa(): psycopg2 puro, para scripts sencillos.
"""
import os
from collections.abc import Generator, Iterator
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from sqlalchemy import MetaData, create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

try:  # lee backend/.env (junto a este archivo) si python-dotenv está instalado
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).with_name(".env"))
except ImportError:  # pragma: no cover
    pass

# Mismos parámetros que psycopg2.connect(host=..., user=..., password=..., database=...)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "HACKATON_DB")

# Las tablas viven en el esquema «mer» que crea manos_en_red_crear_tablas.sql
ESQUEMA = "mer"
OPCIONES = f"-c search_path={ESQUEMA},public -c timezone=America/Bogota"

# psycopg2 no sabe enviar ni recibir uuid.UUID de Python por defecto: se registra una vez.
psycopg2.extras.register_uuid()

# URL.create escapa bien contraseñas con símbolos (@, #, /, :) — no armar la URL a mano.
URL_BD = URL.create(
    "postgresql+psycopg2",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
)

engine = create_engine(
    URL_BD,
    pool_pre_ping=True,          # reabre conexiones que PostgreSQL haya cerrado
    pool_size=5,
    max_overflow=10,
    connect_args={"options": OPCIONES, "connect_timeout": 10},
)

# autoflush=False y expire_on_commit=False: los objetos siguen legibles después del commit
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    metadata = MetaData(schema=ESQUEMA)


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: una sesión por petición.
    Si algo falla, se deshacen los cambios a medias antes de cerrar."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def conexion_directa() -> Iterator[psycopg2.extensions.connection]:
    """psycopg2 puro con los mismos datos del .env.

    with conexion_directa() as con:
        with con.cursor() as cur:
            cur.execute("INSERT INTO habilidades (nombre, categoria) VALUES (%s, %s)", ("Fotografía", "comunicacion"))
    # al salir del with: COMMIT si todo salió bien, ROLLBACK si hubo error, y se cierra la conexión
    """
    con = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        options=OPCIONES,
        connect_timeout=10,
    )
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def verificar_conexion() -> dict:
    """Comprueba que la base responde y que el esquema «mer» tiene sus 16 tablas."""
    with conexion_directa() as con, con.cursor() as cur:
        cur.execute("SELECT current_database(), version()")
        base, version = cur.fetchone()
        cur.execute(
            "SELECT count(*) FROM information_schema.tables "
            "WHERE table_schema = %s AND table_type = 'BASE TABLE'",
            (ESQUEMA,),
        )
        tablas = cur.fetchone()[0]
    return {"base": base, "version": version.split(",")[0], "tablas_mer": tablas}
