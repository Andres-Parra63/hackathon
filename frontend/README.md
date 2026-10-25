# Manos en Red — frontend

Interfaz web (React + Vite) con tema oscuro y minimalista (v2, referencia estética: astroteq.ai), construida
sobre el diseño original de Figma. Especificación de colores, tipografía, tamaños y componentes:
[`docs/diseno-interfaz.md`](../docs/diseno-interfaz.md) (la sección 0 resume la v2).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run lint
```

Si el backend corre en otro host o puerto, crea `frontend/.env` a partir de
[`frontend/.env.example`](./.env.example) y ajusta `VITE_API_URL`.

| Ruta | Pantalla |
|---|---|
| `/` | Sitio público (W01) |
| `/registro` | Registro de voluntario (W07) |
| `/ingreso` | Ingreso de la organización (W02) |
| `/panel` | Panel de la organización (W03); `?nueva=1` abre la nueva convocatoria (W04) |
| `/panel/mapa` | Mapa en vivo y filtro (W05) |
| `/panel/convocatorias` · `/panel/historial` | Convocatorias y respuestas (W06) |
| `/guia` | Guía de estilo viva (tokens y componentes) |

Estructura: `src/styles/tokens.css` (tokens de diseño), `src/styles/base.css` (escala tipográfica),
`src/components/` (componentes base y del panel), `src/pages/` (pantallas), `src/i18n/es.js` (textos de la
interfaz), `src/data/` (datos ficticios y escenas del mapa).

Todos los datos son ficticios. No usar datos personales reales en desarrollo.
