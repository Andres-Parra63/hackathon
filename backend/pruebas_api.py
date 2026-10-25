"""Prueba de punta a punta del CRUD y la API contra una base PostgreSQL real.

Requiere la base creada con manos_en_red_crear_tablas.sql y 03_datos_ejemplo.sql.
Uso:  python pruebas_api.py
"""
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import inspect, text

import models as m
from db import ESQUEMA, Base, engine
from main import app

cliente = TestClient(app)
resultados = []


def ok(nombre: str, condicion: bool, detalle=""):
    resultados.append((nombre, condicion))
    print(("OK   " if condicion else "FALLA ") + nombre + (f"  → {detalle}" if not condicion and detalle else ""))


# 1. Los modelos coinciden columna por columna con la base de datos ------------
insp = inspect(engine)
for tabla in Base.metadata.sorted_tables:
    en_bd = {c["name"] for c in insp.get_columns(tabla.name, schema=ESQUEMA)}
    en_modelo = {c.name for c in tabla.columns}
    ok(f"modelo {tabla.name} = tabla real", en_bd == en_modelo, f"faltan {en_bd - en_modelo}, sobran {en_modelo - en_bd}")
ok("16 tablas mapeadas", len(Base.metadata.tables) == 16, len(Base.metadata.tables))

# 2. Habilidades ---------------------------------------------------------------
r = cliente.get("/habilidades")
habilidades = {h["nombre"]: h["id"] for h in r.json()}
ok("GET /habilidades", r.status_code == 200 and "Logística" in habilidades, r.text[:200])

r = cliente.post("/habilidades", json={"nombre": "Fotografía", "categoria": "comunicacion"})
ok("POST /habilidades", r.status_code == 201, r.text)
foto = r.json()["id"]
r = cliente.patch(f"/habilidades/{foto}", json={"descripcion": "Registro de jornadas"})
ok("PATCH /habilidades", r.status_code == 200 and r.json()["descripcion"] == "Registro de jornadas", r.text)
ok("DELETE /habilidades", cliente.delete(f"/habilidades/{foto}").status_code == 204)

# 3. Voluntarios ---------------------------------------------------------------
nuevo = {
    "nombre": "Laura Prueba", "correo": "laura.prueba@correo.demo", "telefono": "300 111 2233",
    "contrasena": "clave-segura-123", "barrio": "Chapinero", "municipio": "Bogotá, D.C.",
    "lat": 4.648673, "lon": -74.063412, "habilidad_ids": [habilidades["Logística"]],
    "disponibilidades": [{"dia_semana": 6, "franja": "tarde"}], "acepta_tratamiento_datos": True,
}
r = cliente.post("/voluntarios", json=nuevo)
ok("POST /voluntarios", r.status_code == 201, r.text)
vol = r.json()
ok("ubicación redondeada a ~1 km", vol["lat_aprox"] == "4.65", vol.get("lat_aprox"))
ok("código MR-#### generado", vol["codigo"].startswith("MR-"), vol.get("codigo"))

r = cliente.post("/voluntarios", json={**nuevo, "acepta_tratamiento_datos": False, "correo": "otro@correo.demo"})
ok("sin consentimiento → 422", r.status_code == 422)
r = cliente.post("/voluntarios", json=nuevo)
ok("correo repetido → 409", r.status_code == 409, r.text)

r = cliente.patch(f"/voluntarios/{vol['usuario_id']}",
                  json={"barrio": "Teusaquillo", "habilidad_ids": [habilidades["Logística"], habilidades["Cocina"]]})
ok("PATCH /voluntarios", r.status_code == 200 and r.json()["barrio"] == "Teusaquillo"
   and len(r.json()["habilidades"]) == 2, r.text)
ok("GET /voluntarios/{id}", cliente.get(f"/voluntarios/{vol['usuario_id']}").status_code == 200)
ok("GET /voluntarios?habilidad_id", len(cliente.get(f"/voluntarios?habilidad_id={habilidades['Logística']}&limite=100").json()) >= 8)

# 4. Organizaciones y verificación -------------------------------------------
org = {
    "nombre": "Fundación Prueba", "nit": "900555444-1", "tipo": "fundacion", "correo": "contacto@prueba.demo",
    "municipio": "Bogotá, D.C.", "lat": 4.6486, "lon": -74.0634,
    "responsable_nombre": "Pedro Prueba", "responsable_correo": "pedro@prueba.demo",
    "responsable_contrasena": "clave-segura-456", "acepta_tratamiento_datos": True,
}
r = cliente.post("/organizaciones", json=org)
ok("POST /organizaciones", r.status_code == 201 and r.json()["estado_verificacion"] == "pendiente", r.text)
org_id = r.json()["id"]
with engine.connect() as c:
    pedro_id = str(c.scalar(text("SELECT id FROM mer.usuarios WHERE correo = 'pedro@prueba.demo'")))

# Próximo sábado a las 2:00 p. m. hora de Colombia (franja «tarde»), cuando hay voluntarios disponibles
ahora = datetime.now(timezone.utc)
sabado = (ahora + timedelta(days=(5 - ahora.weekday()) % 7 or 7)).replace(hour=19, minute=0, second=0, microsecond=0)
conv = {
    "creada_por": pedro_id, "titulo": "Clasificación de donaciones", "lat": 4.6486, "lon": -74.0634,
    "inicio": sabado.isoformat(), "fin": (sabado + timedelta(hours=4)).isoformat(),
    "cupos": 1, "habilidad_ids": [habilidades["Logística"]], "publicar": True,
}
r = cliente.post(f"/organizaciones/{org_id}/convocatorias", json=conv)
ok("publicar sin verificación → 409", r.status_code == 409, r.text)

r = cliente.post(f"/organizaciones/{org_id}/emergencias",
                 json={"tipo": "inundacion", "titulo": "Prueba", "centro_lat": 4.6, "centro_lon": -74.1,
                       "municipio": "Bogotá, D.C."})
ok("emergencia sin verificación → 409", r.status_code == 409, r.text)

with engine.connect() as c:
    admin_id = str(c.scalar(text("SELECT id FROM mer.usuarios WHERE rol = 'administrador' LIMIT 1")))
r = cliente.post(f"/organizaciones/{org_id}/verificacion", json={"administrador_id": admin_id, "aprobar": True})
ok("POST /organizaciones/{id}/verificacion", r.status_code == 200 and r.json()["estado_verificacion"] == "verificada", r.text)
r = cliente.patch(f"/organizaciones/{org_id}", json={"telefono": "601 222 3344"})
ok("PATCH /organizaciones", r.status_code == 200 and r.json()["telefono"] == "601 222 3344", r.text)

# 5. Convocatorias, emparejamiento y cupos -----------------------------------
r = cliente.post(f"/organizaciones/{org_id}/convocatorias", json=conv)
ok("POST /convocatorias (publicada)", r.status_code == 201 and r.json()["estado"] == "publicada", r.text)
conv_id = r.json()["id"]
ok("habilidades en la salida", r.json()["habilidades"][0]["nombre"] == "Logística", r.json().get("habilidades"))

r = cliente.get(f"/convocatorias/{conv_id}/embudo")
ok("GET /embudo", r.status_code == 200 and r.json()["en_radio"] >= 46, r.text)
r = cliente.get(f"/convocatorias/{conv_id}/candidatos")
ok("GET /candidatos ordenados", r.status_code == 200 and len(r.json()) >= 1
   and r.json()[0]["puntaje"] >= r.json()[-1]["puntaje"], r.text[:200])

r = cliente.post(f"/convocatorias/{conv_id}/postulaciones", params={"voluntario_id": vol["usuario_id"]})
ok("POST /postulaciones con alias", r.status_code == 201 and len(r.json()["alias"]) == 3, r.text)
part_id = r.json()["id"]
r = cliente.post(f"/convocatorias/{conv_id}/convocar", params={"limite": 2})
ok("POST /convocar", r.status_code == 200 and r.json()["convocados"] == 2, r.text)

r = cliente.post(f"/participaciones/{part_id}/respuesta", json={"estado": "confirmado", "detalle": "Voy"})
ok("confirmar → convocatoria cubierta", r.status_code == 200
   and cliente.get(f"/convocatorias/{conv_id}").json()["estado"] == "cubierta", r.text)
otra = [p for p in cliente.get(f"/convocatorias/{conv_id}/participaciones").json() if p["id"] != part_id][0]
r = cliente.post(f"/participaciones/{otra['id']}/respuesta", json={"estado": "confirmado"})
ok("confirmar sin cupo → 409", r.status_code == 409, r.text)

r = cliente.get(f"/convocatorias/{conv_id}/resumen")
ok("GET /resumen", r.status_code == 200 and r.json()["confirmados"] == 1 and r.json()["convocados"] == 3, r.text)
ok("GET /voluntarios/{id}/convocatorias-cercanas",
   cliente.get(f"/voluntarios/{vol['usuario_id']}/convocatorias-cercanas").status_code == 200)

# 6. Asistencia y horas ----------------------------------------------------------
r = cliente.post(f"/participaciones/{part_id}/entrada")
ok("POST /entrada (check-in)", r.status_code == 201, r.text)
r = cliente.post(f"/participaciones/{part_id}/salida")
ok("POST /salida calcula horas", r.status_code == 200 and r.json()["horas"] is not None, r.text)

# 7. Modo Emergencia completo ------------------------------------------------------
r = cliente.post(f"/organizaciones/{org_id}/emergencias",
                 json={"tipo": "inundacion", "titulo": "Inundación de prueba", "centro_lat": 4.6486,
                       "centro_lon": -74.0634, "municipio": "Bogotá, D.C."})
ok("POST /emergencias (por confirmar)", r.status_code == 201 and r.json()["estado"] == "por_confirmar", r.text)
emer_id = r.json()["id"]
desastre = {**conv, "tipo": "desastre", "emergencia_id": emer_id, "titulo": "Turno de emergencia", "cupos": 4}
r = cliente.post(f"/organizaciones/{org_id}/convocatorias", json=desastre)
ok("desastre sin emergencia activa → 409", r.status_code == 409, r.text)
r = cliente.post(f"/emergencias/{emer_id}/confirmar", params={"confirmada_por": admin_id})
ok("POST /emergencias/{id}/confirmar", r.status_code == 200 and r.json()["estado"] == "activa", r.text)
r = cliente.post(f"/organizaciones/{org_id}/puntos",
                 json={"emergencia_id": emer_id, "tipo": "centro_acopio", "nombre": "Acopio de prueba",
                       "direccion": "Calle 1 #2-3", "lat": 4.6486, "lon": -74.0634})
ok("POST /puntos", r.status_code == 201, r.text)
punto_id = r.json()["id"]
r = cliente.post(f"/organizaciones/{org_id}/convocatorias", json={**desastre, "punto_operacion_id": punto_id})
ok("POST convocatoria de desastre", r.status_code == 201 and r.json()["tipo"] == "desastre", r.text)
ok("GET /puntos (mapa ciudadano)", any(p["id"] == punto_id for p in cliente.get("/puntos").json()))
r = cliente.post(f"/emergencias/{emer_id}/cerrar")
ok("cerrar emergencia cierra sus convocatorias", r.status_code == 200 and all(
    c["estado"] == "cerrada" for c in cliente.get(f"/convocatorias?organizacion_id={org_id}&tipo=desastre").json()), r.text)
ok("DELETE /puntos (desactivar)", cliente.delete(f"/puntos/{punto_id}").status_code == 204)

# 8. Borrados con reglas -------------------------------------------------------------
r = cliente.delete(f"/convocatorias/{conv_id}")
ok("borrar convocatoria publicada → 400", r.status_code == 400, r.text)
ok("revocar consentimiento", cliente.post(f"/usuarios/{vol['usuario_id']}/revocar-consentimiento").status_code == 204)
ok("DELETE /voluntarios (supresión)", cliente.delete(f"/voluntarios/{vol['usuario_id']}").status_code == 204)
ok("voluntario eliminado → 404", cliente.get(f"/voluntarios/{vol['usuario_id']}").status_code == 404)

# 9. Uso desde un script (sin FastAPI): la sesión se recupera tras un error ---------
import crud, schemas
from db import SessionLocal, conexion_directa, verificar_conexion

info = verificar_conexion()
ok("verificar_conexion() ve las 16 tablas", info["tablas_mer"] == 16, info)
with SessionLocal() as db:
    repetida = schemas.HabilidadCrear(nombre="Logística", categoria="logistica")
    try:
        crud.crear_habilidad(db, repetida)
        ok("habilidad repetida rechazada", False)
    except Exception:
        ok("habilidad repetida rechazada", True)
    nueva = crud.crear_habilidad(db, schemas.HabilidadCrear(nombre="Primeros auxilios psicológicos", categoria="psicosocial"))
    ok("la misma sesión guarda después del error (rollback)", nueva.id is not None)
with conexion_directa() as con, con.cursor() as cur:
    cur.execute("SELECT count(*) FROM habilidades WHERE nombre = %s", ("Primeros auxilios psicológicos",))
    ok("el dato quedó guardado en PostgreSQL", cur.fetchone()[0] == 1)
    cur.execute("DELETE FROM habilidades WHERE nombre = %s", ("Primeros auxilios psicológicos",))

total, buenas = len(resultados), sum(1 for _, b in resultados if b)
print(f"\n{buenas} de {total} pruebas correctas")
raise SystemExit(0 if buenas == total else 1)
