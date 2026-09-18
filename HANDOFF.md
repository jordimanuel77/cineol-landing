# Cineol Landing — Traspaso de contexto

Prototipo estático (HTML/CSS/JS puro, sin build tools) de la landing de Cineol,
construido a partir del diseño de Figma. Este documento resume el estado
actual para continuar en una nueva conversación sin perder contexto.

## Cómo arrancarlo

```bash
cd "/Users/jordi/Claude/Projects/Cineol-Landing"
python3 dev-server.py
```

Sirve en `http://localhost:5500`. Es un servidor estático a medida (no
`python -m http.server` normal) — importante: **solo desactiva la caché para
`.html/.css/.js`**; las imágenes sí se cachean (`Cache-Control: public,
max-age=3600`). Si tocas `dev-server.py` hay que matar el proceso y
relanzarlo (los cambios en el propio script no se recargan solos).

Para verlo en el navegador de Claude: `preview_start` con `url:
"http://localhost:5500"` (NO uses `name`/launch.json — mira la nota de abajo).

**Nota importante sobre `.claude/launch.json`**: existe pero `preview_start`
con `name` no funciona en esta sesión porque busca el archivo en el
workspace original de scratch, no en este directorio. Solución que
funciona: arrancar el servidor a mano por Bash y usar `preview_start` con
`url` directamente.

## Estructura de archivos

- `index.html` — toda la landing (Hero, Features, CTA)
- `css/styles.css` — todos los estilos
- `js/main.js` — toda la lógica (reveals, parallax, ciclo proyector, scroll-stall butacas)
- `assets/` — imágenes reales (ver mapeo abajo)
- `demo-hero-features-transition.html` — demo aislado inicial, ya no se usa, se puede borrar
- `dev-server.py` — servidor de desarrollo a medida

## Origen del diseño

Figma: `https://www.figma.com/design/YGgndd9fM5ge3Zij5cUgpX/Offscreen---Cineol-UI-Design?node-id=10886-299799&m=dev`

Para volver a consultarlo: usar `get_design_context` / `get_screenshot` /
`get_variable_defs` del MCP de Figma (requiere cargar la skill
`figma-design-to-code` ANTES de `get_design_context`, si no falla).
Tokens de marca ya extraídos están en `:root` de `styles.css`.

## Mapeo de assets

| Archivo | Uso |
|---|---|
| `hero-bg.png` | Fondo del Hero (1920x1447 aprox) |
| `cineol-wordmark-logo.svg` | Logo "CINEOL" del Hero |
| `features-subtract-icon.svg` | Icono decorativo junto al titular de Features |
| `features-1-feed-bg.png` … `features-6-proximamente-bg.png` | Las 6 imágenes de Features, en este orden real: Feed, Valorar, Festivales, Estrenos, Artículos, Logros/Próximamente |
| `1-fachada-bg.png` | Fachada "Cineol Club" (CTA) |
| `2-sala-proyector-1/2/3.png` | 3 frames del haz de luz del proyector (crossfade cíclico) |
| `3-butaca-1.png` | Butacas en reposo (butaca azul sin iluminar) |
| `3-butaca-2.png` | Butaca azul iluminada + logo "OL" (estado final / CTA) — **8MB, va precargada con `<link rel="preload">` en el `<head>`** |
| `cineol-logo.svg`, `cineol-ol-logo.svg` | Sin usar actualmente, por si hacen falta |

## Estado por sección

### Hero
- Imagen a **ancho completo, altura fija `130vh`, `object-fit: cover`** (NO se ajusta al contenido de la imagen — decisión explícita del usuario: quiere comportamiento consistente en cualquier resolución, no que dependa del aspect ratio de la ventana).
- El letrero de Hollywood queda oculto por el propio recorte (parte inferior de la imagen), sin ningún JS ni reveal — es un recorte fijo permanente.
- `.hero` es `position: sticky` (normal, sin trucos de "zona muerta"). Features, justo después en el flujo normal, sube y lo tapa desde el primer píxel de scroll — sin retraso.
- **No hay ningún parallax/reveal JS en el Hero.** Se intentó varias veces (revelar el letrero progresivamente) y siempre chocaba con un conflicto de geometría irresoluble: Features tapa desde abajo hacia arriba, y cualquier reveal del Hero aparece también desde abajo, así que compiten por el mismo espacio y Features siempre gana. Decisión final del usuario: sin reveal, solo tapado simple.
- Degradado al final (`::after`) de `transparent` a `#010e21` para fundir con Features (la ilustración no es negro/azul puro en el borde).

### Features
- Fondo `#010e21` (color de marca, NO negro puro).
- Layout: **bento grid real de Figma** (no una lista simple) — fila superior con tarjeta alta "Comunidad" + columna con (Archivo + Festivales) y debajo la caja de Géneros; fila inferior con Estrenos, Artículos, Logros.
- Caja de Géneros: chips con iconos Lucide `circle-check` inline (no CSS `::before`), `gap: 20px 12px` (fila/columna, medidas reales de Figma), `flex:1` para ocupar todo el alto disponible.
- Esquinas: `border-radius: 32px` + `corner-shape: squircle` (mejora progresiva CSS moderna — Chromium reciente la soporta, en navegadores que no la soporten cae a border-radius normal sin romper nada). **Importante**: un intento anterior con máscara SVG para simular squircle deformaba las cajas en óvalos — no repetir ese enfoque.
- "Logros" (última tarjeta): imagen a `opacity: 0.08` sobre fondo `--cineol-black` (#201f23, NO el `#010e21` general de la sección — este token específico sí coincide con Figma). El valor de opacidad se subió de 0.04 (el literal de Figma) a 0.08 por preferencia visual del usuario tras comparar en vivo.
- Reveals: cada FILA VISUAL se observa como grupo (no cada tarjeta individual) porque una tarjeta más alta tarda más en cruzar el umbral de `IntersectionObserver` que una más baja, rompiendo el orden izquierda→derecha. Ver `setupRevealGroup()` en `main.js`. Entran con `translateY(28px)` (desde abajo, sutil — NO diagonal).
- El titular de Features (`#featuresHeading`) anima el `<h2>` y el icono decorativo por separado (icono con 0.2s de delay extra).

### CTA (sección final)
Tres piezas en orden: fachada → sala de proyección (ciclo de luz) → butacas (scroll-stall).

- **Fachada**: imagen estática, con degradado `::before` de `#010e21` a transparente para fundir con Features.
- **Sala de proyección**: base estática (frame 1, sin recortar, siempre visible — lámparas/ventanas fijas) + 3 frames superpuestos con `clip-path: inset(0 28%)` (solo la franja central del 44% donde está el haz cross-fadea; así las lámparas de los laterales no "parpadean" al no ser exactamente iguales entre frames). Ciclo cada `100ms`, transición `0.1s` — es prácticamente estroboscópico, así lo pidió el usuario explícitamente tras varias iteraciones (2600ms → 900ms → 400ms → 100ms). Se pausa con `visibilitychange` cuando la pestaña no está visible.
- **Butacas**: sección "pinned" con scroll-stall clásico (wrapper alto + `position: sticky` interior). `seats-wrapper` mide `350vh` (bajado desde 650vh original, a petición del usuario, para que cada frase requiera menos scroll).
  - 6 preguntas + estado final "Bienvenido a Cineol" = 7 "zonas", repartidas uniformemente en el alto del wrapper.
  - **Los textos principales (`.seats-line` y `.seats-welcome`) están superpuestos vía `position:absolute`** en la misma posición exacta (`top: calc(14vh + 48px)`) — antes estaban en un flex-column y uno empujaba al otro. Tamaños: texto principal `56px/500`, "Aquí tienes tu sitio" `40px/400`.
  - "Bienvenido a Cineol" → "Aquí tienes tu sitio" → "Pulsa sobre la butaca" animan en cascada (fade + translateY sutil), en ese orden, con delays de 0s / 0.15s / 1s respectivamente.
  - "Pulsa sobre la butaca": `18px/700`, blanco al 40% de opacidad, posicionado **por encima** de la butaca (no superpuesto ni debajo) — `bottom: calc(64vh - 24px)`.
  - Al llegar al estado final, la butaca cambia a `3-butaca-2.png` (iluminada) y el enlace (`<a id="seatsPin">`) se vuelve clicable (`pointer-events`).

## ⚠️ Pendiente / TODO explícito

1. **`href="#"` en `#seatsPin`** (index.html) — falta la URL real de entrada a Cineol. Está marcado con un comentario `<!-- TODO -->` en el HTML.
2. Sin probar a fondo en **mobile/responsive** — todo el trabajo de esta sesión fue en desktop. Hay un media query básico en Features (`@media max-width:900px`) pero el resto (Hero, CTA, butacas) no se ha revisado en pantallas estrechas.
3. ~~Imágenes sin comprimir~~ Resuelto: todos los assets rasterizados se convirtieron a WebP (calidad 85) con Pillow. La carpeta `assets/` pasó de 44MB a 2.2MB. Los `.png`/`.jpg` originales se borraron; las referencias en `index.html` y `js/main.js` (incluido el `<link rel="preload">`) ya apuntan a `.webp`.
4. `demo-hero-features-transition.html` es un resto del demo inicial, ya no se usa — se puede borrar si se quiere limpiar el repo.

## Lecciones técnicas para no repetir errores

- **`html, body { height: 100% }` rompe `position: sticky`** cuando el contenido desborda el viewport (el motor trata el body como si midiera 1 viewport a efectos de sticky). Usar `min-height: 100%` — ya corregido, no revertir.
- **`corner-shape: squircle`** es la vía correcta para el "corner smoothing" de Figma en CSS moderno; las máscaras SVG estiradas (`mask-size:100% 100%`) deforman cajas no cuadradas en óvalos — no usar ese enfoque.
- Antes de asumir que un valor de opacidad/color "no es el correcto", **medir por píxeles** (canvas + `getImageData`) contra una captura real de Figma en vez de solo comparar capturas de pantalla tomadas en momentos distintos (compresión/perfil de color pueden engañar).
- Cachear imágenes pero no HTML/CSS/JS en el servidor de desarrollo — si no, las precargas (`<link rel="preload">`) no sirven de nada.
- El panel de vista previa del propio Claude a veces devuelve una captura completamente negra tras un `scroll`/`navigate` — es un glitch de captura transitorio, no un bug real; repetir el `screenshot` basta.
