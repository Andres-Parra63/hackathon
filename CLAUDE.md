# CLAUDE.md — Manos en Red

Contexto para Claude Code al trabajar en este repositorio. Fuente: documento de proyecto v0.1 (24/10/2026),
https://docs.google.com/document/d/1bobRMsyprKENqvGmR9xwOqtwWGnmFaM_/edit. Si el código real difiere de lo
descrito aquí, manda el código: actualiza este archivo.

## Qué es

**Manos en Red** (nombre provisional) es una plataforma web que conecta voluntarios con organizaciones sociales
según **disponibilidad, ubicación y habilidades**, y que los moviliza de forma ordenada cuando ocurre un desastre
(inundación, sismo, tormenta) mediante el **Modo Emergencia**.

- **Modo normal:** las organizaciones publican actividades (fecha, lugar, cupos, habilidades); los voluntarios
  tienen perfil (habilidades, disponibilidad semanal, zona aproximada) y reciben recomendaciones.
- **Modo Emergencia:** una organización verificada solicita la activación, un coordinador o administrador la
  confirma, se crean puntos de operación (centros de acopio, albergues, bancos de sangre) con turnos y cupos por
  habilidad, y solo se convoca a voluntarios dentro del radio y con la habilidad requerida. Objetivo clave: que
  nadie se desplace por su cuenta a la zona afectada.
- **Ámbito:** Colombia (piloto en Bogotá). Proyecto de hackatón; estado: prototipo / fase de diseño.
- **ODS:** 17 (meta 17.17, alianzas) y 11 (meta 11.5, reducción del impacto de desastres).
- **Licencias:** MIT para el código, CC BY 4.0 para la documentación.

## Roles

| Rol | Puede |
|---|---|
| Voluntario | Crear perfil, ver recomendaciones, postularse, aceptar turnos de emergencia, hacer check-in/out, ver su historial de horas |
| Organización | Registrarse y ser verificada, publicar actividades, ver candidatos, aprobar postulaciones, registrar asistencia y calificar |
| Coordinador de emergencia (organización verificada o autoridad) | Activar y cerrar emergencias, crear puntos de operación y turnos, ver el tablero de cobertura en tiempo real |
| Administrador | Verificar organizaciones (NIT y soporte), confirmar activaciones de emergencia, moderar, gestionar el catálogo de habilidades |
| Ciudadano (visitante, sin cuenta) | Consultar el mapa público de puntos de operación |

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy (ORM), Alembic (migraciones), Pydantic (validación).
- **Base de datos:** PostgreSQL 16 + PostGIS 3 (consultas por distancia con índices espaciales). En local con Docker
  (imagen `postgis/postgis`).
- **Frontend:** React 18+ con Vite, como PWA (caché sin conexión). Mapas con Leaflet + OpenStreetMap.
- **Autenticación:** JWT de corta duración; contraseñas con bcrypt o argon2; permisos por rol.
- **Notificaciones (MVP):** correo (SMTP) y push web (VAPID), enviadas mediante cola. A futuro: Redis + worker.
- **Herramientas:** Node.js 20 LTS, Docker y Docker Compose, Git.

## Estructura del repositorio

```
manos-en-red/
├── docker-compose.yml        # db (PostgreSQL + PostGIS)
├── docker-compose.prod.yml
├── .env.example
├── docs/                     # Documentación (MkDocs) y diagramas
├── backend/
│   ├── requirements.txt
│   ├── alembic/              # Migraciones
│   ├── app/
│   │   ├── main.py           # App FastAPI, routers y CORS
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Esquemas Pydantic
│   │   ├── routers/          # auth, voluntarios, organizaciones, actividades, emergencias, mapa
│   │   ├── services/
│   │   │   ├── matching.py       # Puntaje de compatibilidad
│   │   │   ├── emergency.py      # Activación/cierre, turnos, selección por zona
│   │   │   └── notifications.py  # Cola y envío de convocatorias (correo, push)
│   │   └── core/             # Configuración y seguridad (core/security.py: hash, JWT, roles)
│   ├── scripts/seed.py       # Datos de ejemplo ficticios
│   └── tests/
└── frontend/
    ├── package.json
    └── src/                  # Vistas por rol, mapa, PWA
```

## Comandos

```bash
# Base de datos
docker compose up -d db

# Backend (desde backend/)
python -m venv venv
venv\Scripts\activate            # Windows; en macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head             # crear/actualizar tablas
python -m scripts.seed           # catálogo de habilidades + datos ficticios
uvicorn app.main:app --reload    # API en http://localhost:8000 (Swagger en /docs, ReDoc en /redoc)

# Frontend (desde frontend/)
npm install
npm run dev                      # http://localhost:5173

# Pruebas
cd backend && pytest --cov=app
cd frontend && npx playwright test

# Despliegue
docker compose -f docker-compose.prod.yml up -d --build
```

Variables de entorno (copiar `.env.example` a `.env`): `DATABASE_URL`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_USER`,
`SMTP_PASSWORD`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `FRONTEND_URL` (origen permitido por CORS).

El seed carga las habilidades base (salud, logística, construcción, apoyo psicosocial, cocina, conducción, idiomas),
3 organizaciones, 50 voluntarios y una emergencia de prueba, todo ficticio.

## Convenciones

- **Idioma:** código, identificadores y comentarios en **inglés**; documentación y textos de la interfaz en
  **español**. Los textos de la interfaz van externalizados (no incrustados) para poder traducirlos.
- **Estilo:** PEP 8 con `ruff` y `black` en el backend; ESLint y Prettier en el frontend.
- **Nombres:** `snake_case` para funciones y variables; `PascalCase` para clases y componentes de React.
- **Docstrings:** formato Google (la referencia se genera con MkDocs + mkdocstrings).
- **Ramas:** `main` (estable), `develop` (integración), `feature/*`. Los PR van a `develop`, con revisión.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- **Formatos:** JSON UTF-8; zonas y puntos en GeoJSON (RFC 7946); fechas en ISO 8601 con zona horaria. Guardar
  en UTC y mostrar en la zona del usuario (por defecto `America/Bogota`). Distancias en km. No se maneja dinero.
- **Rutas de la API:** el diseño las define en español (ver abajo); mantenerlas así salvo que el equipo decida otra cosa.

## Modelo de datos

El documento define las entidades en español; en código usar sus equivalentes en inglés.

| Entidad | Atributos principales | Relaciones |
|---|---|---|
| Usuario | id, nombre, correo, hash_contraseña, rol, fecha_autorización_datos | 1:1 con Voluntario u Organización |
| Voluntario | id, usuario_id, zona_aproximada (punto PostGIS redondeado), radio_km, disponibilidad (JSON por día y franja) | N:M Habilidad; 1:N Postulación y Asistencia |
| Organización | id, usuario_id, NIT, tipo, verificada, municipio | 1:N Actividad, Emergencia, PuntoOperación |
| Habilidad | id, nombre, categoría, requiere_certificado | N:M Voluntario y Actividad |
| Actividad | id, organización_id, título, descripción, ubicación, fecha_inicio, fecha_fin, cupos, estado | 1:N Postulación; N:M Habilidad |
| Postulación | id, actividad_id, voluntario_id, estado (pendiente/aprobada/rechazada), puntaje | N:1 Actividad y Voluntario |
| Emergencia | id, tipo (inundación, sismo, tormenta…), zona (polígono), activada_por, estado, fecha_activación | 1:N PuntoOperación |
| PuntoOperación | id, emergencia_id, tipo (acopio, albergue, banco de sangre), dirección, ubicación | 1:N Turno |
| Turno | id, punto_id, habilidad_id, inicio, fin, cupos | 1:N Asistencia |
| Asistencia | id, turno_id o actividad_id, voluntario_id, check_in, check_out | N:1 Voluntario |

Campos obligatorios de una actividad: título, organización_id, ubicación, fecha_inicio, fecha_fin, cupos (> 0) y
al menos una habilidad.

## API (diseño)

| Método | Endpoint | Qué hace |
|---|---|---|
| POST | `/auth/registro` | Crea la cuenta (nombre, correo, contraseña, rol, autorización_datos) y devuelve token |
| PUT | `/voluntarios/me` | Actualiza el perfil (habilidades[], disponibilidad, zona, radio_km) |
| POST | `/actividades` | Publica una actividad |
| GET | `/actividades/recomendadas` | Actividades para el voluntario autenticado, ordenadas por puntaje |
| GET | `/actividades/{id}/candidatos` | Voluntarios compatibles, ordenados por puntaje |
| POST | `/actividades/{id}/postulaciones` | Postularse |
| POST | `/emergencias` | Solicita la activación (tipo, zona GeoJSON, descripción) → estado «por confirmar» |
| POST | `/emergencias/{id}/puntos` | Crea un punto de operación |
| POST | `/puntos/{id}/turnos` | Crea turnos (habilidad, inicio, fin, cupos) y encola la convocatoria |
| POST | `/turnos/{id}/aceptar` | Acepta un turno |
| POST | `/asistencias/{id}/checkin` | Registra entrada o salida |
| GET | `/mapa/puntos` | Puntos de operación públicos activos (GeoJSON) |

## Motor de emparejamiento (`services/matching.py`)

Reglas con puntaje ponderado. **No se usa IA ni aprendizaje automático en el MVP.**

```
puntaje = 0.4 * habilidades_coincidentes
        + 0.3 * cercania            # 1 - distancia / radio
        + 0.2 * disponibilidad_en_franja
        + 0.1 * historial_asistencia
```

- **Filtro duro:** dentro del radio **y** con al menos una habilidad requerida.
- **En emergencia:** excluir las habilidades que exigen certificado si el certificado no está verificado.
- Los pesos son iniciales y deben poder ajustarse tras el piloto (no dejarlos dispersos por el código).
- Debe ser explicable: la organización ve por qué se recomienda a cada voluntario, y la decisión final la toma
  siempre una persona.
- Rendimiento: recomendaciones en menos de 2 s para 10.000 voluntarios (usar índices espaciales de PostGIS).
- Limitaciones conocidas: la distancia es en línea recta (no refleja vías cortadas) y el historial puede favorecer
  a los voluntarios con más antigüedad.

## Reglas de negocio que no se deben romper

**Modo Emergencia**
- Solo una organización verificada puede solicitar la activación, y requiere doble confirmación (administrador o
  coordinador aliado). Toda activación queda en un registro de auditoría.
- Solo se notifica a voluntarios dentro de la zona o el radio y con las habilidades requeridas.
- Los turnos se crean solo en puntos seguros (acopio, albergue, banco de sangre, comedor). Nunca tareas de
  rescate: esas son de los organismos de socorro.
- Al aceptar un turno se descuenta el cupo y el voluntario recibe dirección, horario y recomendaciones de
  seguridad. Si el turno está lleno, se le ofrece otro.
- Cuando se llenan los cupos, la convocatoria se cierra automáticamente.
- Mensajes clave de la interfaz: «no te desplaces sin turno asignado», «inscríbete y espera activación» y
  «gracias, te avisaremos si se necesita más ayuda».
- Al cerrar una emergencia se genera un reporte.
- La PWA guarda en caché la información del turno y del punto de operación para funcionar con conectividad intermitente.

**Privacidad (Ley 1581 de 2012 y Decreto 1377 de 2013)**
- La ubicación del voluntario se guarda **solo aproximada** (redondeada a ~1 km) y nunca se muestra exacta a terceros.
- El registro exige autorización previa, expresa e informada para el tratamiento de datos (guardar la fecha), con
  la política visible y la opción de revocarla y eliminar la cuenta.
- Minimizar datos: nombre, correo, teléfono opcional, zona, disponibilidad, habilidades, certificaciones declaradas
  e historial. **No** recopilar datos de salud ni biométricos.
- Las cuentas inactivas durante 24 meses se anonimizan.
- En desarrollo nunca se usan datos personales reales (solo el seed ficticio).

**Seguridad**
- Secretos solo en variables de entorno o en el gestor de secretos; `.env` en `.gitignore`. Nunca subir claves.
- HTTPS/TLS en tránsito; control de acceso por rol en cada endpoint.
- Revisión de dependencias con Dependabot y `pip-audit` / `npm audit` en cada PR.

**Accesibilidad y UI**
- WCAG 2.1 nivel AA: contraste, navegación por teclado y textos alternativos.
- Azul (confianza) para el modo normal y naranja (alerta) para el Modo Emergencia, **siempre acompañado de texto**,
  nunca solo color.
- Tipografía sans serif legible (p. ej. Inter) desde 16 px, botones grandes para uso con una mano e iconos con etiqueta.
- Un voluntario nuevo debe completar su perfil en menos de 3 minutos desde el celular.

## Pruebas

| Tipo | Qué | Herramienta |
|---|---|---|
| Unitarias | Puntaje, validaciones, permisos | pytest |
| Integración | Endpoints contra PostGIS de prueba | pytest + httpx + contenedor de PostgreSQL |
| End-to-end | Registro, publicación, activación de emergencia, aceptación de turno | Playwright |
| Accesibilidad | Contraste, etiquetas, teclado | axe-core / Lighthouse |

Meta de cobertura del backend: 70 % (pytest-cov), con prioridad en `services/matching.py` y `services/emergency.py`.

## Alcance del MVP

**Incluido:** registro e inicio de sesión; perfil del voluntario; publicación de actividades; emparejamiento por
reglas; Modo Emergencia (activación, convocatoria por zona y habilidad, turnos, check-in/out); mapa de puntos de
operación; panel de la organización con postulaciones y asistencia.

**Fuera de alcance por ahora (no implementar sin pedirlo):** app móvil nativa; SMS y WhatsApp; verificación
automática de organizaciones; emparejamiento con aprendizaje automático; integración con la UNGRD; inventario de
donaciones; certificados de horas con validez oficial.

## Metas del piloto (KPIs)

- Actividad normal cubierta en ≤ 72 h (al menos 3 candidatos compatibles).
- Activación de emergencia → primera convocatoria en ≤ 30 min.
- ≥ 70 % de turnos cubiertos en el simulacro; inasistencia ≤ 20 %.
- 15 organizaciones y 500 voluntarios activos en 3 meses; satisfacción de organizaciones ≥ 4/5.
- Disponibilidad mensual del 99 %.

## Solución de problemas

- `extension postgis does not exist` → usar la imagen `postgis/postgis` en `docker-compose.yml`.
- Error de CORS → `FRONTEND_URL` en `.env` debe coincidir con el origen real; reiniciar el backend.
- No llegan las push → faltan las claves VAPID o el sitio no usa HTTPS (probar en localhost o con HTTPS).

## Glosario

- **ODV:** organización de voluntariado (Ley 720 de 2001).
- **UNGRD:** Unidad Nacional para la Gestión del Riesgo de Desastres.
- **Voluntario espontáneo:** persona sin afiliación previa que se presenta a ayudar tras un desastre.
- **Punto de operación:** lugar físico de apoyo en una emergencia (acopio, albergue, banco de sangre, comedor).
- **Emparejamiento (matching):** relacionar voluntarios y actividades por habilidades, distancia y disponibilidad.

## Pendiente de definir

URL del repositorio, integrantes del equipo y contactos, hosting y proveedores (con capa gratuita), URL de los
entornos de pruebas y producción, correo de `SECURITY.md`, wireframes y diagramas en `docs/`.
