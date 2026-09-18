// ---- Hero ----
// Flujo normal, sin sticky ni JS: el Hero se ve completo al cargar y, al
// hacer scroll, Features sube detrás de él al ritmo natural del scroll.
// El letrero de Hollywood se queda oculto siempre (recorte fijo de .hero-bg).
// El "parallax" que se activa al ver el titular completo es el reveal de
// las tarjetas de Features, justo debajo.

// ---- Reveal de las features al entrar en el viewport (izquierda -> derecha) ----
// No se observa cada tarjeta por separado: una tarjeta más alta (p.ej. la
// de "Comunidad") tarda más en cruzar el umbral de visibilidad que sus
// vecinas más bajas, así que el orden de aparición no coincidía con el
// orden visual izquierda->derecha. En su lugar, se observa la FILA como
// grupo y se revelan todas sus tarjetas a la vez, con el desfase aplicado
// solo a través de transition-delay.
function setupRevealGroup(triggerEl, cards) {
  if (!triggerEl || !cards.length) return;
  cards.forEach((card, i) => card.style.setProperty('--reveal-delay', `${i * 0.15}s`));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        cards.forEach((card) => card.classList.add('visible'));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  observer.observe(triggerEl);
}

// Fila superior visual: tarjeta alta + Archivo + Festivales (izquierda -> derecha)
setupRevealGroup(document.querySelector('.features-row--top'), [
  document.querySelector('.feature-card--tall'),
  ...document.querySelectorAll('.feature-subrow .feature-card'),
]);

// Tarjeta de géneros: sola, sin escalonado
setupRevealGroup(document.querySelector('.feature-card--genres'), [
  document.querySelector('.feature-card--genres'),
]);

// Fila inferior: Estrenos, Artículos, Logros (izquierda -> derecha)
setupRevealGroup(document.querySelector('.features-row--bottom'), [
  ...document.querySelectorAll('.features-row--bottom .feature-card'),
]);

// ---- Reveal del titular de Features (fade-in + desplazamiento leve) ----
const featuresHeading = document.getElementById('featuresHeading');
if (featuresHeading) {
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        headingObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  headingObserver.observe(featuresHeading);
}

// ---- CTA: ciclo del haz de luz del proyector (3 frames en crossfade) ----
// Se pausa cuando la pestaña/ventana no está visible (cambio de escritorio,
// minimizar, etc.) para no seguir repintando de fondo sin necesidad.
const projectorFrames = document.querySelectorAll('[data-frame]');
if (projectorFrames.length) {
  let frameIndex = 0;
  let projectorTimer = null;

  function startProjector() {
    if (projectorTimer) return;
    projectorTimer = setInterval(() => {
      projectorFrames[frameIndex].classList.remove('is-active');
      frameIndex = (frameIndex + 1) % projectorFrames.length;
      projectorFrames[frameIndex].classList.add('is-active');
    }, 100);
  }
  function stopProjector() {
    clearInterval(projectorTimer);
    projectorTimer = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopProjector();
    else startProjector();
  });
  startProjector();
}

// ---- CTA: butacas con ciclo automático (pregunta a pregunta hasta el estado final) ----
// Ya no depende del scroll: la sección ocupa 100vh (es la última de la
// página, así que no hay nada debajo a lo que "escapar" haciendo scroll) y
// el ciclo de frases avanza solo, cada ZONE_DURATION, en cuanto la sección
// entra en el viewport.
const seatsWrapper = document.getElementById('seatsWrapper');
const seatsPin = document.getElementById('seatsPin');
const seatsBg = document.getElementById('seatsBg');
const seatsLine = document.getElementById('seatsLine');
const seatsWelcome = document.getElementById('seatsWelcome');
const seatsCue = document.getElementById('seatsCue');

const SEATS_LINES = [
  '¿Recuerdas la primera vez que fuiste al cine?',
  '¿Con quién fuiste?',
  '¿Qué película viste?',
  'El olor a palomitas.',
  'La cortina que se abre desvelando el secreto.',
  'Las primeras veces son las que siempre se recuerdan.'
];
const TOTAL_ZONES = SEATS_LINES.length + 1; // +1 = estado final "Bienvenido a Cineol"
const FINAL_ZONE = TOTAL_ZONES - 1;
const ZONE_DURATION = 3000; // ms que se queda cada frase en pantalla

// Al entrar en el estado final, primero se ve la butaca iluminada sola
// (WELCOME_DELAY) y solo entonces empieza la cascada de texto; el aviso
// "Pulsa sobre la butaca" llega el último, tras la cascada (CUE_DELAY).
const WELCOME_DELAY = 900;
const CUE_DELAY = 1900;

function renderSeatsZone(zone) {
  if (zone === FINAL_ZONE) {
    seatsBg.src = 'assets/3-butaca-2.webp';
    seatsLine.classList.remove('is-visible');
    seatsPin.classList.add('is-final');
    setTimeout(() => seatsWelcome.classList.add('is-visible'), WELCOME_DELAY);
    setTimeout(() => seatsCue.classList.add('is-visible'), CUE_DELAY);
  } else {
    seatsBg.src = 'assets/3-butaca-1.webp';
    seatsWelcome.classList.remove('is-visible');
    seatsPin.classList.remove('is-final');
    seatsCue.classList.remove('is-visible');
    seatsLine.textContent = SEATS_LINES[zone];
    seatsLine.classList.remove('is-visible');
    requestAnimationFrame(() => seatsLine.classList.add('is-visible'));
  }
}

function playSeatsZone(zone) {
  renderSeatsZone(zone);
  if (zone < FINAL_ZONE) {
    setTimeout(() => playSeatsZone(zone + 1), ZONE_DURATION);
  }
}

// Arranca una sola vez, la primera vez que la sección entra en el viewport.
if (seatsWrapper) {
  const seatsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        playSeatsZone(0);
        seatsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  seatsObserver.observe(seatsWrapper);
}
