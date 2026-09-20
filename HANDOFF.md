# Cineol Landing — Documentación para developers

Landing estática (HTML/CSS/JS puro, **sin build tools ni dependencias**) construida a partir del diseño de Figma. Tres bloques: Hero, Features (bento grid) y CTA (fachada, sala de proyección y butacas con el enlace de entrada a Cineol).

- **Producción (GitHub Pages):** https://jordimanuel77.github.io/cineol-landing/
- **Repo:** https://github.com/jordimanuel77/cineol-landing (público, cuenta personal `jordimanuel77`)
- **Figma:** https://www.figma.com/design/YGgndd9fM5ge3Zij5cUgpX/Offscreen---Cineol-UI-Design (landing completa: `node-id=10886-299799`; tarjeta de badges de géneros: `node-id=10892-301370`)

## Cómo verlo y publicarlo

```bash
python3 dev-server.py        # http://localhost:5500
```

Basta también con abrir `index.html`, pero conviene usar `dev-server.py`: desactiva la caché solo para `.html/.css/.js` y deja cachear las imágenes (`Cache-Control: public, max-age=3600`). Si tocas `dev-server.py`, hay que matar y relanzar el proceso.

**Publicar:** GitHub Pages sirve la rama `main` (raíz, modo "legacy", sin workflow). Basta con `git push`; el sitio tarda ~30 s en reflejarlo (y el navegador puede tener caché: Cmd+Shift+R). Si el build no arranca solo: `gh api -X POST repos/jordimanuel77/cineol-landing/pages/builds`.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Toda la landing (Hero, Features, CTA) |
| `css/styles.css` | Todos los estilos. Tokens de marca en `:root` |
| `js/main.js` | Reveals, ciclo del proyector y secuencia de las butacas |
| `assets/` | Imágenes en **WebP** + logos SVG |
| `dev-server.py` | Servidor de desarrollo con la política de caché descrita arriba |
| `demo-hero-features-transition.html` | Demo inicial, **sin usar**, se puede borrar |
| `.claude/launch.json` | Config de la herramienta de preview usada en desarrollo (no afecta a la web) |

## Assets

Todas las imágenes raster se convirtieron a WebP calidad 85 con Pillow (`assets/` pasó de 44 MB a ~2 MB). **No quedan los PNG/JPG originales en el repo**: para cambiar una imagen, exportarla de Figma (PNG) y convertirla:

```python
from PIL import Image
Image.open('nueva.png').convert('RGB').save('assets/nombre.webp', 'WEBP', quality=85, method=6)
```

| Archivo | Uso |
|---|---|
| `hero-bg.webp` | Fondo del Hero (1920×1447) |
| `features-1…6-*.webp` | Imágenes de las tarjetas de Features (feed, valorar, festivales, estrenos, artículos, logros/próximamente) |
| `1-fachada-bg.webp` | Fachada "Cineol Club" |
| `2-sala-proyector-1/2/3.webp` | 3 frames del haz de luz del proyector |
| `3-butaca-1.webp` / `3-butaca-2.webp` | Butacas en reposo / butaca azul iluminada con el logo "OL" (precargada con `<link rel="preload">`) |
| `cineol-wordmark-logo.svg`, `features-subtract-icon.svg` | Logo del Hero e icono junto al titular de Features |
| `cineol-logo.svg`, `cineol-ol-logo.svg` | Sin usar |

## Cómo funciona cada bloque

### Hero
- `.hero` mide `130vh` y fluye con normalidad (no es sticky). `object-fit: cover` con `object-position: top center`; con esa altura la imagen siempre se muestra entera en vertical (solo se recorta por los lados), en cualquier resolución.
- El letrero de Hollywood **sí llega a verse** al hacer scroll justo antes de que Features cubra el Hero. Es intencionado.
- `.hero-content` ocupa el primer viewport (`100svh`) y centra vertical y horizontalmente el titular y el subtítulo. El logo (`.hero-logo`) está fuera del flujo, fijo a `top: 112px`.
- Titular y subtítulo entran con el mismo efecto que el titular de Features (fade-in + 24 px desde abajo, 0,8 s; subtítulo 0,2 s después), disparado por `IntersectionObserver` en `main.js`.

### Features
- Bento grid: fila superior con tarjeta alta "Comunidad" + columna (Archivo + Festivales, y debajo la tarjeta de Géneros); fila inferior con Estrenos, Artículos y Logros. Separación de 96 px entre el titular y el grid.
- **Reveal por fila**, no por tarjeta (`setupRevealGroup()`): una tarjeta más alta tarda más en cruzar el umbral del observer y rompía el orden izquierda→derecha. Entran con `translateY(28px)` y 0,15 s de desfase.
- Tarjeta de géneros con los colores de Figma: fondo `#0f172a`, borde/badges `#334155`, texto `#f8fafc`; badges activos `#f9e0fa` con texto `#18181b`. Iconos `circle-check` inline (estilo Lucide).
- Esquinas `border-radius: 32px` + `corner-shape: squircle` (mejora progresiva: Chromium reciente; el resto cae a radio normal). No usar máscaras SVG estiradas: deforman las cajas en óvalos.
- "Logros": imagen a `opacity: 0.08` sobre `--cineol-black`.
- Con `max-width: 900px` todo se apila en columna y el logo "OL" pasa **encima** del titular (`flex-direction: column-reverse`).

### CTA
1. **Fachada:** imagen estática.
2. **Sala de proyección:** frame 1 sin recortar como base fija + 3 frames superpuestos con `clip-path: inset(0 28%)` (solo cross-fadea la franja central del haz, así las lámparas laterales no parpadean). Ciclo cada 100 ms (casi estroboscópico, a petición expresa). Se pausa con `visibilitychange`.
3. **Butacas** (última sección, `100vh`). Ya **no depende del scroll**: un `IntersectionObserver` (`threshold: 0.6`) arranca la secuencia una sola vez al entrar en viewport, y como es el final del documento no hay nada a lo que "escapar" haciendo scroll:
   - Frase 1 → frase 2 con **crossfade** (dos `<p class="seats-line">`, el segundo se crea por JS y se alternan). Cada una dura `ZONE_DURATION = 3000` ms.
   - La última frase empieza a desvanecerse `FADE_OUT = 800` ms antes de acabar su tiempo, de modo que ha desaparecido del todo cuando se ilumina el fondo.
   - Al iluminarse (`3-butaca-2.webp`), `WELCOME_DELAY = 900` ms después entra "Bienvenido a Cineol" + "Aquí tienes tu sitio." y a `CUE_DELAY = 1900` ms aparece "Pulsa sobre la butaca".
   - **Loader:** barra 128×5 px, extremos redondos, fondo blanco 20 %, relleno `--cineol-placeholder` (`#6f6d78`). Se rellena de izquierda a derecha durante `frases × ZONE_DURATION` (6 s) y se oculta de golpe, sin fade, al iluminarse el fondo. Es ficticio: solo indica lo que falta para que acabe la secuencia.
   - El enlace `#seatsPin` (`href="https://www.cineol.net/"`) solo es clicable cuando aparece "Pulsa sobre la butaca" (clase `is-final`).
   - **Posicionamiento:** la butaca azul del asset siempre queda al **39.53vh** de la imagen (medido por color de píxel; constante porque `object-fit: cover` con `height: 100vh` escala la imagen entera). Todo se ancla a ese valor: bloque de bienvenida `top: calc(39.53vh - 196px)` (16 px sobre la butaca), aviso `calc(39.53vh - 38px)` y loader `calc(39.53vh - 29px)`. Las frases usan el mismo `top` que el bloque de bienvenida. En `≤600px` se reducen las fuentes (56→32, 40→22, 18→14 px) y se recalculan los offsets.

## Lecciones técnicas (no repetir errores)

- `html, body { height: 100% }` rompe `position: sticky` si el contenido desborda; usar `min-height`.
- Los offsets en `px` no escalan con el viewport; los `vh` sí. Al mezclarlos (top en `vh` + bottom en `px`) los elementos se solapan en otras resoluciones. Anclar todo al mismo punto (aquí, la butaca) y probar en 375×812, 768×1024 y ~1512×945.
- Antes de decidir que un color/opacidad "no coincide" con Figma, medir por píxel (canvas + `getImageData`) o con `getComputedStyle`, no comparar capturas.
- Los valores de Figma se leen con `get_design_context` / `get_variable_defs` (MCP de Figma; hay que cargar antes la skill `figma-design-to-code`). `Cineol/brand-new-car` = `#155dfc` = `--cineol-brand-blue`.
- Cachear imágenes pero no HTML/CSS/JS en dev, si no el `preload` no sirve de nada.
- En la herramienta de preview de Claude: las capturas a veces salen negras (repetir), y con la pestaña oculta `requestAnimationFrame` se pausa (un scroll real la reactiva). No son bugs de la web.

## Pendiente / ideas

1. Mobile del Hero: con `object-fit: cover` en pantallas muy estrechas hay un tramo largo de cielo antes de llegar a las colinas. No tiene arreglo por CSS sin adelantar el letrero; requeriría un recorte específico de la imagen.
2. En mobile (375×812) el loader y la base de la butaca quedan cerca; revisar si hace falta más margen.
3. Accesibilidad: no hay `prefers-reduced-motion`, ni `aria-live` para las frases de las butacas, ni foco visible en `#seatsPin`.
4. SEO/compartir: faltan `<meta name="description">`, Open Graph y favicon.
5. La secuencia de butacas se reproduce una sola vez por carga; no se reinicia si el usuario sube y vuelve a bajar.
6. Las fuentes (Inter) se cargan desde Google Fonts; valorar autoalojarlas.
7. El repo es público y vive en una cuenta personal; valorar transferirlo a la organización de Cineol.
8. Borrar `demo-hero-features-transition.html` y los SVG sin usar si ya no hacen falta.
