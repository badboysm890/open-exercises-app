'use strict';

const gridEl = document.getElementById('grid');
const searchEl = document.getElementById('search');
const countEl = document.getElementById('count');
const backdropEl = document.getElementById('sheet-backdrop');
const sheetEl = document.getElementById('sheet');
const sheetCloseEl = document.getElementById('sheet-close');
const sheetStageEl = document.getElementById('sheet-stage');
const sheetTitleEl = document.getElementById('sheet-title');
const sheetSkinEl = document.getElementById('sheet-skin');
const sheetInstructionsEl = document.getElementById('sheet-instructions');
const sheetNoteEl = document.getElementById('sheet-note');

let catalog = [];
let sheetAnimation = null;
let sheetOpen = false;
let lastFocusedCard = null;

const animationCache = new Map(); // file -> Promise<animationData>
const cardRegistry = new Map(); // id -> { card, thumbEl, anim, visible }

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Deterministic theme override for previews/screenshots: ?theme=light|dark
const themeParam = new URLSearchParams(location.search).get('theme');
if (themeParam === 'light' || themeParam === 'dark') {
  document.documentElement.dataset.theme = themeParam;
}

function titleCase(name) {
  return (name || '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function fetchAnimation(file) {
  if (!animationCache.has(file)) {
    animationCache.set(
      file,
      fetch('/data/' + file)
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load animation: ' + r.status);
          return r.json();
        })
    );
  }
  return animationCache.get(file);
}

async function loadCatalog() {
  const res = await fetch('/data/catalog.json');
  if (!res.ok) throw new Error('Failed to load catalog: ' + res.status);
  catalog = await res.json();
  countEl.textContent = catalog.length + ' exercises';
  buildCards();
}

function buildCards() {
  const frag = document.createDocumentFragment();
  for (const ex of catalog) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.id = ex.id;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const thumbHost = document.createElement('div');
    thumbHost.className = 'lottie-thumb';
    thumbHost.hidden = true;
    const thumbPlaceholder = document.createElement('span');
    thumbPlaceholder.className = 'loading-dots';
    thumbPlaceholder.textContent = '···';
    thumb.append(thumbHost, thumbPlaceholder);

    const body = document.createElement('div');
    body.className = 'card-body';
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = titleCase(ex.name);
    const sub = document.createElement('div');
    sub.className = 'card-sub';
    sub.textContent = (ex.skin || 'preview').replace(/_/g, ' ');
    body.append(name, sub);

    card.append(thumb, body);
    card.addEventListener('click', () => openSheet(ex, card));
    frag.append(card);

    cardRegistry.set(ex.id, {
      card,
      ex,
      thumbHost,
      thumbPlaceholder,
      anim: null,
      visible: false,
      loaded: false,
    });
  }
  gridEl.append(frag);
  observeThumbnails();
}

// Load + run thumbnail previews only near the viewport; pause off-screen.
function observeThumbnails() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const reg = [...cardRegistry.values()].find((r) => r.card === entry.target);
        if (!reg) continue;
        reg.visible = entry.isIntersecting;
        if (reg.visible) {
          ensureThumb(reg);
        } else if (reg.anim) {
          reg.anim.pause();
        }
      }
    },
    { rootMargin: '200px 0px' }
  );
  for (const reg of cardRegistry.values()) {
    io.observe(reg.card);
  }
}

async function ensureThumb(reg) {
  if (reg.loaded) {
    if (reg.anim) reg.anim.play();
    return;
  }
  reg.loaded = true;
  try {
    const data = await fetchAnimation(reg.ex.file);
    if (!cardRegistry.has(reg.ex.id)) return;
    reg.thumbPlaceholder.remove();
    reg.thumbHost.hidden = false;
    reg.anim = lottie.loadAnimation({
      container: reg.thumbHost,
      renderer: 'svg',
      loop: true,
      autoplay: reg.visible,
      animationData: data,
    });
  } catch {
    reg.thumbPlaceholder.textContent = 'Error';
  }
}

function applySearch() {
  const q = searchEl.value.trim().toLowerCase();
  let shown = 0;
  for (const reg of cardRegistry.values()) {
    const match =
      !q ||
      (reg.ex.name || '').toLowerCase().includes(q) ||
      (reg.ex.introduce || '').toLowerCase().includes(q);
    reg.card.toggleAttribute('hidden', !match);
    if (match) shown++;
  }
  countEl.textContent = q ? shown + ' of ' + catalog.length + ' exercises' : catalog.length + ' exercises';
  emptyEl.hidden = shown !== 0;
}

const emptyEl = document.createElement('div');
emptyEl.className = 'empty';
emptyEl.hidden = true;
gridEl.append(emptyEl);

// ---------- Detail sheet ----------

async function openSheet(ex, cardEl) {
  lastFocusedCard = cardEl;
  sheetOpen = true;
  sheetTitleEl.textContent = titleCase(ex.name);
  sheetSkinEl.textContent = (ex.skin || '').replace(/_/g, ' ');
  renderInstructions(ex.introduce || '');

  sheetCloseEl.focus();
  sheetEl.scrollTop = 0;
  backdropEl.classList.add('open');
  sheetEl.classList.add('open');

  destroySheetAnimation();
  sheetStageEl.innerHTML = '';
  const host = document.createElement('div');
  host.className = 'lottie';
  sheetStageEl.append(host);

  try {
    const data = await fetchAnimation(ex.file);
    if (!sheetOpen) return;
    sheetAnimation = lottie.loadAnimation({
      container: host,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: data,
    });
  } catch (err) {
    sheetStageEl.innerHTML = '';
    const p = document.createElement('div');
    p.className = 'empty';
    p.textContent = 'Could not load animation: ' + err.message;
    sheetStageEl.append(p);
  }
}

function destroySheetAnimation() {
  if (sheetAnimation) {
    sheetAnimation.destroy();
    sheetAnimation = null;
  }
}

function closeSheet() {
  sheetOpen = false;
  backdropEl.classList.remove('open');
  sheetEl.classList.remove('open');
  setTimeout(() => {
    if (!sheetOpen) {
      destroySheetAnimation();
      sheetStageEl.innerHTML = '';
    }
  }, reduceMotion ? 0 : 450);
  if (lastFocusedCard) lastFocusedCard.focus();
}

function renderInstructions(text) {
  sheetInstructionsEl.innerHTML = '';
  // The catalog stores line breaks as literal "\\n" escapes in some entries.
  const lines = text
    .replace(/\\n/g, '\n')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return;

  const linesEl = document.createElement('ol');
  linesEl.className = 'sheet-instructions';
  for (const line of lines) {
    const li = document.createElement('li');
    li.textContent = line;
    linesEl.append(li);
  }
  sheetInstructionsEl.append(linesEl);
  sheetNoteEl.textContent = '';
}

// Counter styling lives on the <ol> via a class; attach it here for clarity.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen) closeSheet();
});

sheetCloseEl.addEventListener('click', closeSheet);
backdropEl.addEventListener('click', closeSheet);
searchEl.addEventListener('input', applySearch);

loadCatalog().catch((err) => {
  countEl.textContent = '';
  gridEl.innerHTML = '';
  emptyEl.textContent = 'Failed to load catalog: ' + err.message;
  emptyEl.hidden = false;
});
