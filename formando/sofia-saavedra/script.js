/* script.js — otimizado: particles pool, reveal sequencial e scroll fix */

/* CONFIGURÁVEIS */
const PARTICLE_COUNT_DEFAULT = 26;      // quantidade padrão
const AUDIO_FADE_MS = 500;              // fade-in do áudio (ms)

/* ELEMENTOS */
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('tela-inicial');
const mainContent = document.getElementById('main-content');
const audioEl = document.getElementById('music');
const muteBtn = document.getElementById('mute-btn');
const mapBtn = document.querySelector('.map-button');

/* ajuste automático para dispositivos com CPU fraca */
function suggestedParticleCount() {
  const cores = navigator.hardwareConcurrency || 2;
  // se poucos cores, diminuir partículas
  if (cores <= 2) return Math.max(8, Math.floor(PARTICLE_COUNT_DEFAULT / 3));
  if (cores <= 4) return Math.max(14, Math.floor(PARTICLE_COUNT_DEFAULT / 1.8));
  return PARTICLE_COUNT_DEFAULT;
}

/* CRIA partícula pool — não recria indefinidamente (usa animação CSS infinite) */
function createParticles(count = suggestedParticleCount()) {
  // remover partículas antigas
  document.querySelectorAll('.particle').forEach(n => n.remove());

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';

    const size = Math.round(4 + Math.random() * 10);
    el.style.width = size + 'px';
    el.style.height = size + 'px';

    // left aleatório
    el.style.left = (Math.random() * 100) + 'vw';
    // começa entre 100vh e 150vh para efeito subir
    el.style.top = (100 + Math.random() * 50) + 'vh';

    const dur = 6 + Math.random() * 8;       // 6-14s
    const delay = Math.random() * -dur;      // negative delay espalha no tempo

    el.style.animation = `rise ${dur}s linear ${delay}s infinite`;
    el.style.opacity = (0.5 + Math.random() * 0.5).toString();

    // sombra leve conforme tamanho
    el.style.boxShadow = `0 0 ${Math.max(4, Math.round(size/2))}px rgba(255,215,102,0.25)`;

    document.body.appendChild(el);
  }
}

/* fade-in suave do áudio */
function fadeInAudio(audio, target = 0.5, duration = AUDIO_FADE_MS) {
  audio.volume = 0;
  const steps = 20;
  const stepTime = Math.max(20, Math.floor(duration / steps));
  const stepAmount = target / steps;
  let current = 0;
  const iv = setInterval(() => {
    current += stepAmount;
    audio.volume = Math.min(current, target);
    if (audio.volume >= target - 0.001) clearInterval(iv);
  }, stepTime);
}

/* função que aplica staggered animation nos "fade items" */
function revealSequence() {
  // selecione os blocos na ordem que quer que apareçam
  const selectors = [
    '.bloco_foto-titulo',
    '.bloco-titulo h1',
    '.subtitle',
    '.carta',
    '.info',
    '.map-button',
    '.footer-note'
  ];
  const nodes = [];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(n => nodes.push(n));
  });

  // adicione a classe fade-item (caso ainda não exista)
  nodes.forEach(n => n.classList.add('fade-item'));

  // aplicar delay incremental
  nodes.forEach((el, i) => {
    const delay = i * 160; // 160ms entre itens — reduz para acelerar, aumenta para dramatizar
    el.style.animationDelay = `${delay}ms`;
  });

  // aciona a classe de reveal no main (dispara as animações CSS)
  requestAnimationFrame(() => mainContent.classList.add('reveal'));
}

/* START BUTTON - comportamento */
startBtn.addEventListener('click', async () => {
  // esconder tela inicial (fade)
  startScreen.style.transition = 'opacity .45s ease';
  startScreen.style.opacity = '0';
  startScreen.style.pointerEvents = 'none';
  setTimeout(() => startScreen.classList.add('hidden'), 520);

  // mostrar main e permitir scroll
  mainContent.classList.remove('hidden');
  mainContent.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'auto';

  // criar partículas (apenas uma vez)
  createParticles(70);

  // sequencia de reveal (anima os blocos em ordem)
  setTimeout(() => revealSequence(), 120);

  // tentar tocar audio (user gesture foi feita com o clique)
  try {
    await audioEl.play();
    fadeInAudio(audioEl, 0.5, AUDIO_FADE_MS);
    if (muteBtn) { muteBtn.classList.remove('hidden'); muteBtn.classList.add('mute'); muteBtn.textContent = '🔊'; }
  } catch (err) {
    console.warn('Áudio bloqueado: nova interação necessária.', err);
  }
});

/* mute toggle */
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    if (audioEl.paused) {
      audioEl.play().then(()=> { fadeInAudio(audioEl, 0.5, 500); muteBtn.textContent='🔊'; })
        .catch(()=> alert('Toque na tela para permitir áudio no navegador.'));
    } else {
      audioEl.pause(); muteBtn.textContent = '🔈';
    }
  });
}

/* performance: pause audio se aba não estiver visível (economia) */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!audioEl.paused) audioEl.pause();
  }
});

