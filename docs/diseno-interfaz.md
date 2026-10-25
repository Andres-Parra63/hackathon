# Diseño de la interfaz — Manos en Red

Especificación de la interfaz web implementada en `frontend/` a partir del archivo de Figma
[voluntariado — Prototipo web móvil (MVP)](https://www.figma.com/design/ZMpZ59PtUlVg3AOIsqlLOW/voluntariado-%E2%80%94-Prototipo-web-m%C3%B3vil--MVP-?node-id=23-216),
página **💻 Web (escritorio)** y página **🎨 Guía de estilo y componentes**.

- Los valores salen de las **variables y estilos de Figma**. En código viven en
  [`frontend/src/styles/tokens.css`](../frontend/src/styles/tokens.css) (color, radios, espacios, sombras) y
  [`frontend/src/styles/base.css`](../frontend/src/styles/base.css) (escala tipográfica).
- La guía viva está en la ruta **`/guia`** de la app: muestra los tokens y componentes reales.
- Regla: ningún componente usa valores sueltos; si hace falta un valor nuevo, se agrega como token.

## 0. Versión 2 — minimalista oscuro (25/10/2026)

La interfaz pasó a un tema oscuro y minimalista tomando como referencia estética [astroteq.ai](https://astroteq.ai/).
**Los valores de color, tipografía y radios de las secciones 2 a 4 quedan reemplazados** por los de
`tokens.css` y `base.css`; la guía viva (`/guia`) muestra los valores vigentes. Lo demás (rutas, requisitos,
comportamiento) sigue aplicando.

| Aspecto | v2 |
|---|---|
| Lienzo | Negro `#000000`; tarjetas `#0B0B0D`; cristal = blanco al 3 % con borde blanco al 10 % y desenfoque de 16 px |
| Texto | `#EBF1FF` (títulos, 18:1), `#C4C8D2` (cuerpo, 12:1), `#8F94A0` (secundario, 6,9:1) |
| Azul (modo normal) | Dos tonos: `#0A63E6` para rellenos con texto blanco (5,4:1) y `#5C9DFF` para texto, iconos y enlaces sobre negro (7,7:1). El `#066EFF` de la referencia no llega a 4,5:1 con texto blanco |
| Naranja (Modo Emergencia) | `#FFA733` (10,8:1), siempre junto al texto «Modo Emergencia» o «Emergencia» |
| Tipografía | DM Sans variable a peso 510 con tracking negativo (títulos y cifras) y DM Mono para leads, etiquetas y fuentes |
| Controles | Botones e inputs en píldora de 52 px; bordes de control blancos al 38 % (3,3:1, WCAG 1.4.11) |
| Botones | Primario (píldora clara), Secundario (cristal), Contorno (borde azul + punto, como el CTA de la referencia), Emergencia (borde naranja + punto), Terciario |

**Landing (`/`), en orden:** hero centrado con globo de puntos sobre Colombia (canvas: el anillo alrededor de
Bogotá ilustra el radio de convocatoria; no está a escala) y cuatro cifras alrededor (metas del piloto,
marcadas como tales) · El problema (cifras con fuente) · Cómo funciona (3 pasos) · Modo Emergencia (línea de
tiempo de 5 pasos que se ilumina al leer, más los mensajes clave de la interfaz) · Para quién (pestañas por
rol: voluntarios, organizaciones, coordinadores, ciudadanos) · Simulacros (carrusel de escenarios
**ficticios** con cifras simuladas) · Comparación y garantías · Solicitud de acceso para organizaciones
(formulario con validación; en el prototipo no envía datos a ningún servidor).

**v2.1 — dinamismo (25/10/2026)**
- **Globo** (`components/DotGlobe.jsx` + `globeGeo.js`): mundo completo en puntos con la cara trasera visible
  en tenue; gira 360° y frena cuando Colombia mira al frente; se arrastra con inercia. Colombia se dibuja
  **ampliada ×2,3 y elevada** sobre la superficie (la esfera no cambia de tamaño), con el radio de Bogotá,
  barrido de radar, voluntarios que se iluminan al paso del barrido, arcos de convocatoria a otras ciudades,
  anillo HUD y coordenadas. Es ilustrativo y la leyenda lo dice.
- **Hero con scrollytelling** (escritorio, con movimiento): se fija durante el scroll; el texto se desvanece,
  el escenario sube hasta centrar el globo y este gira hasta enfocar Colombia. En móvil no se fija, pero el
  enfoque avanza con el scroll.
- **Cinta de actividad simulada** (`LiveTicker`), con botón de pausa (WCAG 2.2.2), pausa al pasar el cursor
  o con el foco, y estática con movimiento reducido.
- **Navegador flotante de secciones** (`SectionNav`): anterior/siguiente con la sección actual; aparece al
  salir del hero y se oculta (`inert`) junto al pie.
- **Microinteracciones**: eyebrows que se "decodifican" (`data-scramble`; el texto real va en un `sr-only`),
  resplandor que sigue al cursor en las tarjetas de cristal (`data-spotlight`), título con shimmer y píldora
  deslizante en las pestañas (transitions-dev 15 y 16), y aurora lenta detrás del globo.
- Rendimiento del globo medido en Edge sin GPU: mediana de 7 ms por fotograma, p95 de 13,9 ms.

**Decisiones de accesibilidad nuevas**
- Las entradas animadas usan `opacity`, no `autoAlpha`: `visibility: hidden` sacaba del orden de tabulación
  todo lo que aún no se había revelado (el formulario y el carrusel eran inalcanzables con teclado).
- Los pasos inactivos de la línea de tiempo se atenúan por color (título en `text-muted`), no por opacidad,
  para no bajar de 4,5:1.
- Pestañas con el patrón WAI-ARIA (flechas, Inicio, Fin); carrusel sin reproducción automática, con botones,
  puntos de 24 px de área y anuncio de la posición; menú móvil como diálogo modal (Escape, foco atrapado y
  devuelto al botón).
- Formulario: etiquetas visibles, pista y error bajo cada campo (icono + texto, enlazados con
  `aria-describedby`), resumen de errores con enlaces a cada campo y autorización de datos (Ley 1581).
- Verificado con axe-core (WCAG 2.1 A/AA) en todas las rutas: 0 incidencias.

## 1. Pantallas y rutas

| Figma | Pantalla | Ruta | Requisitos |
|---|---|---|---|
| W01 (23:233) | Sitio público — Inicio | `/` | — |
| W07 (25:400) | Registro de voluntario | `/registro` | CU-04, RF-05 |
| W02 (25:549) | Ingreso de la organización | `/ingreso` | RNF-02 |
| W03 (26:507) | Panel de la organización | `/panel` | — |
| W04 (26:900) | Nueva convocatoria (panel lateral) | botón «Nueva convocatoria» o `/panel?nueva=1` | RF-02, RF-05, RF-06 |
| W05 (27:1022) | Mapa en vivo y filtro | `/panel/mapa` | RF-03, RF-09 |
| W06 (27:1395) | Convocatorias y respuestas | `/panel/convocatorias`, `/panel/historial` | RF-07, RF-08 |
| — | Guía de estilo | `/guia` | — |

Flujo de demostración: `/ingreso` → «Ingresar al panel» → `/panel` → «Nueva convocatoria» → «Enviar
convocatoria» → `/panel/mapa` (convocatoria enviada) → «Ver respuestas» → `/panel/convocatorias`.

## 2. Color

| Token | Valor | Uso |
|---|---|---|
| `--brand-primary` | `#1F5FBF` | Acción principal, enlaces, énfasis, modo normal (azul = confianza) |
| `--brand-primary-strong` | `#164A96` | Hover/presionado, texto sobre fondo suave |
| `--brand-primary-soft` | `#E3ECFA` | Fondos de acento, ítem activo del menú |
| `--brand-primary-subtle` | `#F3F7FD` | Fondos muy suaves |
| `--text-strong` | `#161827` | Títulos y valores |
| `--text-default` | `#3B3F54` | Texto de cuerpo |
| `--text-muted` | `#6C7086` | Texto secundario, iconos de campo |
| `--text-on-color` | `#FFFFFF` | Texto sobre rellenos de color |
| `--surface-page` | `#F5F6F8` | Fondo de página |
| `--surface-card` | `#FFFFFF` | Tarjetas |
| `--surface-sunken` | `#ECEEF2` | Pistas de progreso, badges neutros |
| `--border-default` | `#E2E4E9` | Bordes de tarjeta y tabla |
| `--border-strong` | `#C6CAD2` | Bordes de botón secundario y campos |
| `--overlay-scrim` | `#161827` al 45 % | Velo detrás del panel lateral |
| `--status-success` / `-soft` | `#12805A` / `#E2F4EC` | Confirmado, disponible |
| `--status-warning` / `-soft` | `#A55F00` / `#FFF1D9` | Emergencia, sin respuesta (naranja = alerta) |
| `--status-info` / `-soft` | `#2456C9` / `#E7EEFC` | Información, «En vivo» |
| `--map-land`, `--map-block`, `--map-road`, `--map-park`, `--map-water` | `#EEF0EA`, `#E3E6DE`, `#FFFFFF`, `#D6EBD0`, `#C7DFF1` | Mapa ilustrativo |

Contraste (WCAG 2.1 AA): `text-strong`, `text-default` y `text-muted` sobre blanco y sobre `surface-page`
superan 4,5:1 (`text-muted` sobre `surface-page` ≈ 4,6:1); blanco sobre `brand-primary` ≈ 6,1:1.
**Atención**: `status-warning` sobre `status-warning-soft` da ≈ 4,4:1, apenas por debajo de 4,5:1 para el
texto de 12 px de los badges; conviene oscurecer `status-warning` (p. ej. `#975600`) en Figma y aquí.
Los estados **siempre** llevan texto, nunca solo color.

## 3. Tipografía

Familia: **Plus Jakarta Sans** (Google Fonts, pesos 400/500/600/700/800). El seguimiento de Figma está en %;
en CSS se expresa en `em`.

| Clase | Estilo Figma | Tamaño / interlineado | Peso | Seguimiento |
|---|---|---|---|---|
| `.t-display` | Web/Display | 64 / 72 | ExtraBold 800 | −3 % |
| `.t-h1-web` | Web/H1 | 44 / 52 | Bold 700 | −2 % |
| `.t-h2-web` | Web/H2 | 32 / 40 | Bold 700 | −1,5 % |
| `.t-h2` | Heading/H2 | 20 / 26 | Bold 700 | −1 % |
| `.t-h3` | Heading/H3 | 17 / 22 | Bold 700 | −0,5 % |
| `.t-body-xl` | Web/Body XL | 20 / 30 | Regular 400 | 0 |
| `.t-body-lg` | Body/Large | 16 / 24 | Regular 400 | 0 |
| `.t-body` | Body/Default | 15 / 22 | Regular 400 | 0 |
| `.t-body-strong` | Body/Strong | 15 / 22 | SemiBold 600 | 0 |
| `.t-body-sm` | Body/Small | 13 / 18 | Regular 400 | 0 |
| `.t-label` | Label/Default | 14 / 18 | SemiBold 600 | 0 |
| `.t-label-sm` | Label/Small | 12 / 16 | SemiBold 600 | 0 |
| `.t-caption` | Caption | 12 / 16 | Medium 500 | 0 |
| `.t-overline` | Overline | 11 / 14, MAYÚSCULAS | Bold 700 | +8 % |
| `.t-button` | Button | 16 / 20 | Bold 700 | 0 |
| `.t-numeral-lg` | Numeral/Large | 44 / 48 | ExtraBold 800 | −2 % |
| `.t-numeral-md` | Numeral/Medium | 28 / 32 | ExtraBold 800 | −2 % |

Logotipo: «Manos en Red» 22 / 26 ExtraBold, −2 %, junto al isotipo de 32 px (separación 8 px).

Por debajo de 720 px los títulos grandes se reducen (Display 40/46, H1 30/36, H2 26/32, Body XL 17/26).
El cuerpo nunca baja de 16 px en campos de formulario.

## 4. Espaciado, radios y elevación

**Espaciado** (base 4 px, con los medios pasos del diseño): 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36,
40, 48, 56, 64, 72, 96, 120 → `--space-*`.

**Retícula del sitio**: marco de 1440 px, contenido de 1200 px y márgenes de 120 px
(`--page-gutter: clamp(16px, 8.3vw, 120px)`). Secciones con 96 px de padding vertical (72 px en héroe y
confianza). **Panel**: barra lateral de 248 px, contenido con 32 px de margen y 24 px entre bloques.

| Token | Valor | Dónde |
|---|---|---|
| `--radius-xs` | 7 px | Casilla |
| `--radius-sm` | 10 px | Ícono de organización (36 px) |
| `--radius-md` | 12 px | Ítems del menú, búsqueda, segmentos |
| `--radius-control` | 14 px | Botones, campos, chips |
| `--radius-lg` | 16 px | Notas, mosaicos de ícono de 52 px |
| `--radius-xl` | 18 px | Tarjetas de métrica, leyenda |
| `--radius-2xl` | 20 px | Tarjetas flotantes, aviso push |
| `--radius-3xl` | 24 px | Tarjetas |
| `--radius-4xl` | 28 px | Formulario de registro, tarjetas de público |
| `--radius-5xl` | 32 px | Visual del héroe, banda de llamado a la acción |
| `--radius-pill` | 999 px | Badges, filtros, contadores |

| Token | Sombra | Uso |
|---|---|---|
| `--elevation-1` · Tarjeta | `0 1 2 #1618270D`, `0 4 12 #1618270D` | Tarjetas, filtros |
| `--elevation-2` · Flotante | `0 2 6 #1618270D`, `0 8 24 #1618271A` | Formulario, leyenda, CTA |
| `--elevation-3` · Notificación | `0 4 10 #16182714`, `0 18 40 #16182738` | Aviso push, panel lateral |

## 5. Componentes

| Componente (Figma) | Código | Especificación |
|---|---|---|
| Botón (4:23) | `Button` | Alto 52, padding 0 22, radio 14, gap 8, ícono 20, texto Button. **Primario**: relleno `brand-primary`, hover `brand-primary-strong`. **Secundario**: blanco, borde 1,5 `border-strong`, texto `text-strong`. **Terciario**: sin relleno, texto `brand-primary`, padding derecho 4. Deshabilitado: 50 % de opacidad. |
| Badge (4:53) | `Badge` | Padding 4 10 4 8, píldora, punto de 6 px, Label/Small. Tonos: Crítico (`brand-primary-soft` / `brand-primary-strong`), Éxito, Alerta, Info, Neutro (`surface-sunken` / `text-default`). |
| Chip (Tipo de sangre → Habilidad) | `SkillChip` | Alto 56, radio 14, borde 1,5 `border-default`, texto 14/26 Bold −1 %. Seleccionado: relleno `brand-primary`, borde `brand-primary-strong`, texto blanco y check blanco de 18 px arriba a la derecha (4,5 px). Es un botón con `aria-pressed`. |
| Campo de formulario (4:85) | `TextField`, `TextArea` | Etiqueta Label/Default + 8 px + control de 52 px, radio 14, padding 0 16, gap 10, ícono 20 `text-muted`, texto 16/24 `text-strong`. **Foco**: borde 2 px `brand-primary` y el ícono pasa a `brand-primary`. Área de texto: 96 px de alto, 15/22. |
| Interruptor | `Switch` | Pista 48 × 28 radio 14 (`brand-primary` activo, `border-strong` inactivo), perilla de 22 px. `role="switch"`. |
| Casilla | `Checkbox` | 24 px, radio 7, borde 2 `border-strong`; marcada: relleno `brand-primary` con check blanco de 16. |
| Nota | `Note` | Padding 14, radio 16, ícono 20 del color del tono, Body/Small `text-default`. Tonos info, sunken, success. |
| Progreso | `ProgressBar` | Pista `surface-sunken`, alto 8 (10 en tarjetas grandes), radio = alto/2. Tonos brand, muted, success. |
| Tarjeta/Métrica (4:246) | `MetricCard` | Padding 14, radio 18, borde `border-default`, ícono 20 `brand-primary`, Numeral/Medium, Caption `text-muted`. |
| Web/Encabezado sitio (22:597) | `SiteHeader` | 80 px, borde inferior, enlaces Label/Default con 36 px de separación, acciones con 12 px. Fijo arriba al hacer scroll. |
| Web/Barra lateral (22:593) | `Sidebar` | 248 px, padding 24 16 20, gap 24. Ítem: padding 10 12, radio 12, ícono 20. Activo: fondo `brand-primary-soft`, ícono `brand-primary`, texto `brand-primary-strong`. Contador: píldora `brand-primary`. |
| Web/Encabezado panel (22:632) | `PanelHeader` | Padding 28 32 20, título Web/H2, búsqueda 280 × 44 radio 12, campana 44 px, botón primario. |
| Web/Tabla (22:653) | `ResponsesTable` | Encabezado Overline en `surface-page`, filas de 12 px de padding vertical, avatar anónimo de 32 px. Voluntarios **solo con código** (#A12), nunca nombre ni teléfono. |
| Mapa/Base web (22:706) | `IllustratedMap` | Mapa ilustrativo de 1000 × 760 (no es cartografía real), radio de 5 km, puntos aproximados por barrio, punto de operación con halo. Escenas `hero`, `panel` y `live` en `src/data/mapScenes.js`. |
| Panel lateral | `NewCallDrawer` | 520 px, `elevation-3`, velo al 45 %. Encabezado y pie con borde, cuerpo con scroll. `role="dialog"`, se cierra con Esc o clic en el velo. |

**Iconos**: 44 iconos de la biblioteca de Figma (rejilla de 24 px, trazo de 2 px) en
`src/assets/icons/`. Se dibujan como máscara CSS y toman `currentColor`. Tamaños usados: 14, 16, 18, 20, 22,
24, 26, 28. Todo ícono que comunica algo lleva etiqueta (`label`); los decorativos van con `aria-hidden`.

## 6. Comportamiento y accesibilidad

- **Foco visible** en todo elemento interactivo: anillo de 3 px `rgb(31 95 191 / .35)`; en campos, el foco
  se muestra en el borde.
- **Teclado**: chips, segmentos, filtros y pestañas son botones o radios nativos; el panel lateral recibe el
  foco al abrirse y lo devuelve al cerrarse.
- **Movimiento**: ver la sección 6.1; con `prefers-reduced-motion: reduce` todo queda estático.
- **Objetivos táctiles** ≥ 44 px (botones de 52 px, chips de 56 px).
- **Responsive**: el sitio pasa a una columna por debajo de 960–1180 px; el panel convierte la barra lateral
  en una barra superior con menú desplazable por debajo de 960 px.
- **Privacidad visible** (Ley 1581 de 2012): ubicación aproximada por barrio, voluntarios anonimizados en
  tablas y mapa, y casilla de autorización de datos **sin marcar por defecto**.

### 6.1 Animación

Librerías: **GSAP 3.15** (ScrollTrigger, SplitText, `@gsap/react`) y **Lenis 1.3** para el scroll suave,
sincronizado con el ticker de GSAP. Código en `frontend/src/motion/`.

| Archivo | Responsabilidad |
|---|---|
| `gsap.js` | Registro de plugins, curvas, duraciones, distancias y condiciones (`MOTION_OK`, `REDUCED`, `FINE_POINTER`, `DESKTOP`) |
| `smoothScroll.js` | Lenis solo en escritorio con mouse o trackpad; en pantallas táctiles el scroll es nativo |
| `useReveal.js` | Entradas declarativas por atributos `data-*`, parallax y versión simplificada |
| `interactions.js` | Microinteracciones: `gsap.timeline({ paused: true })` por elemento, controladas con `mouseenter`/`mouseleave` y al presionar |
| `PageTransition.jsx` | Entrada de cada página y pestaña |

| Token | Valor | Uso |
|---|---|---|
| `EASE.out` | `power3.out` | Entradas, hover |
| `EASE.smooth` | `expo.out` | Títulos, entrada de página, panel lateral |
| `EASE.inOut` | `power2.inOut` | Salidas, ocultar el encabezado |
| `EASE.settle` | `elastic.out(1, 0.75)` | Rebote suave al soltar un clic |
| `DURATION` | 0,4 / 0,8 / 1,2 s | Rápida / base / lenta |
| `DISTANCE` | 28 px | Recorrido de las entradas (pequeño a propósito) |

**Atributos** (hook `useReveal`): `data-reveal="up|fade|scale|left|right"`, `data-stagger` (hijos en secuencia,
90 ms), `data-split` (títulos línea a línea con máscara), `data-count` (cuenta el número una vez),
`data-parallax="-6"` (desplazamiento en % al hacer scroll) y `data-delay`. Las entradas se disparan al llegar
al **80 % del viewport** con `toggleActions: "play none none reverse"`: aparecen al bajar y se ocultan al volver
a subir. Las entradas usan `xPercent`/`yPercent` y el hover usa `x`/`y`/`scale`; GSAP los compone, así que no
se pisan entre sí.

| Dónde | Qué pasa |
|---|---|
| Carga de página | Fundido con subida de 18 px (1 s, `expo.out`); en el héroe, el título entra palabra por palabra cuando la fuente ya cargó, para que nada salte |
| Héroe | Texto, botones y cifras en cascada; el mapa se arma (radio, puntos al azar, punto de operación); avisos que respiran; inclinación 3D de 5° con el mouse; parallax al hacer scroll |
| Encabezado | Entra desde arriba, se oculta al bajar y vuelve al subir, sombra al desplazarse, barra de progreso de lectura |
| Secciones | Títulos línea a línea, tarjetas en cascada, cifras que cuentan, parallax sutil en las grillas, banda final que se abre al hacer scroll |
| «Cómo funciona» (escritorio) | **Sección fija (pin)** mientras las tres tarjetas aparecen una tras otra y la línea de progreso avanza, ligada al scroll (`scrub`) |
| Hover y clic | Tarjetas suben 6 px y su ícono gira; botones suben 2 px; al presionar bajan a 96 % y vuelven con rebote suave; CTA principales magnéticos |
| Panel | Métricas que cuentan, filas en cascada, barras que se llenan, zoom suave del mapa, panel lateral que entra y sale deslizándose |

**Rendimiento**: solo se animan `transform` y `opacity` (las barras de progreso se desplazan con `xPercent` en
lugar de animar `width`); `gsap.context()` (vía `useGSAP` y `matchMedia`) limpia todo al cambiar de página.

**Movimiento reducido** (`prefers-reduced-motion: reduce`, por ejemplo con los efectos de animación de Windows
apagados): se mantiene la misma coreografía **solo con fundidos de opacidad**. No hay desplazamientos, parallax,
pin, hover con movimiento ni Lenis.

## 7. Diferencias con Figma y pendientes

- La **casilla de consentimiento** aparece marcada en Figma (W07). En código empieza **sin marcar**, porque la
  autorización debe ser previa y expresa; el botón «Crear mi perfil» se habilita al marcarla y elegir al
  menos una habilidad.
- En la **guía de estilo de Figma**, los textos de las muestras siguen con valores de una versión anterior
  (p. ej. `brand/primary #D62839`, rojo). Los valores vigentes son los de las **variables** (azul `#1F5FBF`),
  que son los que usa el código.
- Varios componentes maestros de Figma conservan nombres y textos de la plantilla original de donación de
  sangre (`Chip · Tipo de sangre`, «Hospital General del Norte», «Puede donar O−»). Las pantallas usan
  instancias con los textos correctos; conviene renombrar los maestros.
- El mapa base exportado traía etiquetas de otra ciudad. En código se quitaron y los barrios de Bogotá se
  pintan como texto, como en las instancias de Figma.
- La opacidad del **velo** (W04) no viene en los datos de Figma; se usó 45 %.
- El tipo de convocatoria «Desastre» usa el azul de marca en Figma. CLAUDE.md pide naranja para el Modo
  Emergencia: en el código, el badge «Emergencia» ya usa el tono de alerta, pero el segmento sigue al diseño.
- Falta implementar la página **📱 Prototipo** (app móvil del voluntario).

## Áreas por rol (25/10/2026)

Sesión de demostración (`frontend/src/auth/`): el ingreso valida contra cuentas ficticias y redirige según el rol;
`RequireRole` protege las rutas. No hay JWT todavía: se sustituye cuando el backend lo tenga.

| Ruta | Rol | Contenido |
|---|---|---|
| `/voluntario` | Voluntario | Inicio con recomendaciones y puntaje explicado, `/turnos` (aceptar, seguridad, check-in/out), `/horas`, `/perfil` (disponibilidad, radio, revocar autorización, eliminar cuenta) |
| `/panel` | Organización | Panel, mapa, convocatorias, historial, `/actividades` (publicar, candidatos, asistencia, calificación) y `/emergencia` (solicitar, puntos, turnos, cierre con reporte) |
| `/admin` | Administrador | Resumen y pesos, `/organizaciones` (verificar o rechazar con motivo), `/emergencias` (confirmar, cerrar, auditoría), `/habilidades` |
| `/mapa` | Ciudadano (sin cuenta) | Puntos de operación en Leaflet + OpenStreetMap, datos GeoJSON ficticios |

Los pesos del emparejamiento viven solo en `frontend/src/data/matching.js`. Todos los datos son ficticios y
locales al navegador; conectar a la API queda pendiente.
