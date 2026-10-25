"""Prueba de conexión a la base de datos de Manos en Red.

Versión corregida de src/conexion.py:
  * La contraseña ya no está escrita aquí: se lee de backend/.env.
  * La conexión se cierra siempre (antes quedaba abierta).
  * Además de conectar, revisa que el esquema «mer» tenga las 16 tablas,
    que es lo que necesita el CRUD para guardar datos.

Ejecutar desde la carpeta del proyecto (hackathon):
    python src/conexion.py
"""
import os
import sys

import psycopg2

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
except ImportError:
    print("Aviso: instala python-dotenv (pip install python-dotenv) para leer el archivo .env")

conexion = None
try:
    conexion = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "HACKATON_DB"),
    )  
    print("Conexion exitosa")

    with conexion.cursor() as cursor:
        cursor.execute(
            "SELECT count(*) FROM information_schema.tables "
            "WHERE table_schema = 'mer' AND table_type = 'BASE TABLE'"
        )
        tablas = cursor.fetchone()[0]

    if tablas == 16:
        print("Esquema «mer» listo: 16 tablas encontradas. El CRUD puede guardar datos.")
    elif tablas == 0:
        print("La base existe pero no tiene las tablas. Ejecuta manos_en_red_crear_tablas.sql en esta base.")
        sys.exit(1)
    else:
        print(f"Se encontraron {tablas} tablas en «mer» (se esperaban 16). Vuelve a ejecutar el script de creación.")
        sys.exit(1)

except psycopg2.OperationalError as ex:
    print("No se pudo conectar. Revisa que PostgreSQL esté encendido y los datos de backend/.env.")
    print("Detalle:", ex)
    sys.exit(1)
except Exception as ex:
    print("Error:", ex)
    sys.exit(1)
finally:
    if conexion is not None:
        conexion.close()
