// Porta Negra Café · demo
import { initKit } from '../kit/kit.js?v=1';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esDesk = () => innerWidth >= 900;

/* =========================================================
   INTRO: se dibuja el logo, se prende la ventana, la puerta se abre
   ========================================================= */
const intro = $('.intro');
function terminarIntro() {
  html.classList.add('listo');
  html.classList.remove('con-intro');
  intro?.classList.add('fin');
}
if (html.classList.contains('con-intro') && intro) {
  const corto = innerWidth < 900;
  const minimo = corto ? 1000 : 1350;            // trazo + luz
  const t0 = performance.now();
  const heroImg = corto ? $('.hero__fondo img') : $('.puerta__marco img');
  const cargada = (img) => new Promise((r) => { if (!img || img.complete) return r(); img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const tope = new Promise((r) => setTimeout(r, 2600));
  Promise.race([Promise.all([document.fonts?.ready, cargada(heroImg)]), tope]).then(() => {
    const espera = Math.max(0, minimo - (performance.now() - t0));
    setTimeout(() => {
      intro.classList.add('abre');
      setTimeout(() => html.classList.add('listo'), corto ? 120 : 180);
      setTimeout(terminarIntro, corto ? 520 : 720);
    }, espera);
  });
} else {
  terminarIntro();
}

/* =========================================================
   BARRA: sólida al bajar, menú del celu, link activo
   ========================================================= */
const barra = $('[data-barra]');
let rafBarra = 0;
addEventListener('scroll', () => {
  if (rafBarra) return;
  rafBarra = requestAnimationFrame(() => { rafBarra = 0; barra.classList.toggle('solida', scrollY > 40); });
}, { passive: true });
barra.classList.toggle('solida', scrollY > 40);

const menu = $('[data-menu]');
const btnMenu = $('[data-menu-btn]');
let scrollGuardado = 0;
function bloquear(on) {
  if (on) { scrollGuardado = scrollY; document.body.style.cssText = `position:fixed;top:-${scrollGuardado}px;left:0;right:0`; }
  else { document.body.style.cssText = ''; scrollTo({ top: scrollGuardado, behavior: 'instant' }); }
}
function abrirMenu(on) {
  menu.hidden = !on;
  btnMenu.setAttribute('aria-expanded', String(on));
  btnMenu.setAttribute('aria-label', on ? 'Cerrar menú' : 'Abrir menú');
  barra.classList.toggle('solida', on || scrollY > 40);
  html.classList.toggle('menu-abierto', on);
  bloquear(on);
}
btnMenu.addEventListener('click', () => abrirMenu(menu.hidden));
menu.addEventListener('click', (e) => {
  const a = e.target.closest('a'); if (!a) return;
  e.preventDefault();
  abrirMenu(false);
  const dest = $(a.getAttribute('href'));
  requestAnimationFrame(() => dest?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) abrirMenu(false); });
addEventListener('resize', () => { if (innerWidth >= 1024 && !menu.hidden) abrirMenu(false); });

const navLinks = $$('.barra__nav a');
const ioNav = new IntersectionObserver((ents) => {
  ents.forEach((en) => { if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id)); });
}, { rootMargin: '-45% 0px -50% 0px' });
['carta', 'encargos', 'sucursales', 'agenda'].forEach((id) => { const s = document.getElementById(id); if (s) ioNav.observe(s); });

new IntersectionObserver(([en]) => html.classList.toggle('en-hero', en.isIntersecting), { threshold: 0.35 }).observe($('#inicio'));

/* =========================================================
   ENTRADAS AL HACER SCROLL
   ========================================================= */
const ioR = new IntersectionObserver((ents) => {
  ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visto'); ioR.unobserve(en.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
$$('[data-r]').forEach((el) => ioR.observe(el));

/* =========================================================
   LA BARRA: métodos de filtrado
   ========================================================= */
const METODOS = [
  { nom: 'V60', txt: 'Filtrado cónico de vertido lento: una taza limpia, brillante, donde se notan las notas del grano.' },
  { nom: 'Chemex', txt: 'Filtro de papel grueso y vertido pausado: cuerpo liviano y una taza muy limpia.' },
  { nom: 'Aeropress', txt: 'Inmersión corta y presión suave: intenso, redondo y con poco amargor.' },
  { nom: 'Prensa francesa', txt: 'Inmersión completa con filtro de metal: más cuerpo y textura en la taza.' },
  { nom: 'Sifón', txt: 'Vapor y vacío, un clásico de barra: aromático, delicado y para verlo hacer.' },
];
const filaM = $('[data-metodos]');
const det = $('.metodo-det');
function elegirMetodo(i) {
  $$('.metodo', filaM).forEach((b, k) => { const on = k === i; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
  $('[data-metodo-nom]').textContent = METODOS[i].nom;
  $('[data-metodo-txt]').textContent = METODOS[i].txt;
  det.classList.remove('cambia'); void det.offsetWidth; det.classList.add('cambia');
}
filaM.addEventListener('click', (e) => { const b = e.target.closest('[data-metodo]'); if (b) elegirMetodo(Number(b.dataset.metodo)); });
filaM.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const b = e.target.closest('[data-metodo]'); if (b && !b.classList.contains('is-on')) elegirMetodo(Number(b.dataset.metodo));
});

/* =========================================================
   KIT: carta (vidriera), mostrador de encargos, carrito y panel
   ========================================================= */
const ENCARGABLES = new Set(['alfajores', 'cookies', 'chipa', 'grano']);
const ANTERIOR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const SIGUIENTE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
const thumb = (src) => src.replace(/\.webp$/, '-s.webp');

const kit = await initKit({
  config: 'cliente.json',
  cartas: {
    'carta-kit': {
      itemClass: 'it',
      pedir: false,
      template: (p, ctx) => {
        const foto = p.foto ? ctx.asset(p.foto) : '';
        return `${foto ? `<img class="it__thumb" src="${esc(thumb(foto))}" alt="" width="56" height="56" loading="lazy" decoding="async">` : ''}
          <h3 class="it__nom">${foto ? '<span class="it__dot" aria-hidden="true"></span>' : ''}<span>${esc(p.nombre)}</span></h3>
          <span class="it__precio">${esc(ctx.money(p.precio) ?? 'Consultar')}</span>
          ${p.descripcion ? `<p class="it__desc">${esc(p.descripcion)}</p>` : ''}
          ${p.disponible === false ? '<p class="it__desc">Hoy no hay</p>' : ''}`;
      },
    },
    'caja-kit': {
      itemClass: 'et',
      template: (p, ctx) => `<h3 class="et__nom">${esc(p.nombre)}</h3>
          ${p.descripcion ? `<p class="et__desc">${esc(p.descripcion)}</p>` : '<span></span>'}
          <div class="et__lado">
            <span class="et__precio">${esc(ctx.money(p.precio) ?? 'Consultar')}</span>
            <div class="et__qty" data-kit-qty="${esc(p.id)}"></div>
          </div>`,
    },
  },
  carrito: {
    label: 'Tu encargo',
    icono: '<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>',
  },
  badge: true,
});

/* ---------- carta: encabezado de sección, Anterior/Siguiente, foto fija ---------- */
const cartaKit = $('#carta-kit');
function armarCarta(el) {
  const tabs = $$('.kit-tab', el);
  const paneles = $$('.kit-carta__panel', el);
  paneles.forEach((panel, i) => {
    if ($('.carta-cab', panel)) return;
    const tab = tabs[i];
    const items = $$('.kit-item', panel);
    const cat = items[0]?.dataset.cat;
    const cab = document.createElement('div');
    cab.className = 'carta-cab';
    const enc = ENCARGABLES.has(cat);
    cab.innerHTML = `<span class="carta-cab__n">${i + 1} de ${paneles.length}</span>
      <h3 class="carta-cab__nom">${esc(tab?.textContent || '')}</h3>
      <span class="carta-cab__nota">${items.length} ${items.length === 1 ? 'opción' : 'opciones'} · ${enc ? (cat === 'grano' ? '<a href="#barra">se encarga para retirar</a>' : '<a href="#encargos">se encargan para retirar</a>') : 'en el local'}</span>`;
    const lista = document.createElement('div');
    lista.className = 'carta-lista';
    items.forEach((it) => { if (it.dataset.photo) it.classList.add('con-foto'); lista.appendChild(it); });
    if (!items.some((it) => $('.it__desc', it)) && items.length > 3) lista.classList.add('cols');
    const prev = tabs[i - 1], next = tabs[i + 1];
    const nav = document.createElement('div');
    nav.className = 'carta-nav';
    nav.innerHTML = `<button type="button" data-prev ${prev ? '' : 'disabled'}>${ANTERIOR}<span>${esc(prev?.textContent || 'Anterior')}</span></button>
      <button type="button" data-next ${next ? '' : 'disabled'}><span>${esc(next?.textContent || 'Siguiente')}</span>${SIGUIENTE}</button>`;
    nav.querySelector('[data-prev]').addEventListener('click', () => irA(prev, el));
    nav.querySelector('[data-next]').addEventListener('click', () => irA(next, el));
    panel.replaceChildren(cab, lista, nav);
  });
}
function irA(tab, el) {
  if (!tab) return;
  tab.click();
  tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  const panel = $('.kit-carta__panel:not([hidden])', el);
  const top = panel.getBoundingClientRect().top;
  const margen = esDesk() ? 110 : 140;
  if (top < margen - 10 || top > innerHeight * 0.6) scrollTo({ top: scrollY + top - margen, behavior: reduce ? 'auto' : 'smooth' });
}
// pestaña activa siempre a la vista en el celu
cartaKit.addEventListener('click', (e) => {
  const t = e.target.closest('.kit-tab'); if (!t || esDesk()) return;
  t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
});

// foto del plato en la caja fija (desktop)
const fotoImg = $('[data-carta-foto]');
const fotoNom = $('[data-carta-foto-nom]');
let rafFoto = 0, ultimo = null;
cartaKit.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const it = e.target.closest('.kit-item');
  if (!it || it === ultimo) return;
  cancelAnimationFrame(rafFoto);
  rafFoto = requestAnimationFrame(() => {
    ultimo?.classList.remove('hover');
    ultimo = it; it.classList.add('hover');
    const src = it.dataset.photo;
    if (!src || fotoImg.dataset.src === src) return;
    fotoImg.dataset.src = src;
    fotoImg.classList.add('cambia');
    const nom = $('.it__nom', it)?.textContent.trim() || '';
    setTimeout(() => {
      const pre = new Image(); pre.src = src;
      const poner = () => { fotoImg.src = src; fotoNom.textContent = nom; requestAnimationFrame(() => fotoImg.classList.remove('cambia')); };
      pre.decode ? pre.decode().then(poner, poner) : (pre.onload = poner);
    }, 180);
  });
});

document.addEventListener('kit:carta', (e) => { if (e.detail.el.id === 'carta-kit') armarCarta(e.detail.el); });
if (cartaKit && $('.kit-carta__panel', cartaKit)) armarCarta(cartaKit);

/* ---------- contador del encargo en la barra ---------- */
const btnEnc = $('.btn-encargo');
const nEnc = $('[data-encargo-n]');
const unidades = () => (kit.carrito?.lineas || []).reduce((s, l) => s + l.cant, 0);
function contar(bump) {
  const n = unidades();
  nEnc.textContent = n;
  btnEnc.classList.toggle('tiene', n > 0);
  btnEnc.setAttribute('aria-label', n ? `Ver tu encargo (${n})` : 'Ver tu encargo');
  if (bump) { btnEnc.classList.remove('bump'); void btnEnc.offsetWidth; btnEnc.classList.add('bump'); }
}

/* =========================================================
   ARMÁ TU CAJA: la caja muestra las piezas del encargo
   ========================================================= */
const LUGARES = 6;
const huecosEl = $('[data-huecos]');
const caja = $('[data-caja]');
let productos = [];
async function leerProductos() { productos = await kit.store.getProductos(); pintarCaja(); }
function pintarCaja() {
  const piezas = [];
  let total = 0, n = 0;
  for (const l of kit.carrito?.lineas || []) {
    const p = productos.find((x) => x.id === l.id);
    if (!p || !['alfajores', 'cookies', 'chipa'].includes(p.categoria)) continue;
    n += l.cant; total += (p.precio || 0) * l.cant;
    for (let k = 0; k < l.cant; k++) piezas.push(p.nombre.replace(/^(Alfajor|Cookie) /, ''));
  }
  const viejos = $$('.hueco', huecosEl).map((h) => h.textContent);
  huecosEl.innerHTML = Array.from({ length: LUGARES }, (_, i) => {
    if (i === LUGARES - 1 && piezas.length > LUGARES) return `<li class="hueco lleno mas">+${piezas.length - LUGARES + 1} más</li>`;
    const t = piezas[i];
    if (!t) return '<li class="hueco" aria-hidden="true"></li>';
    const nuevo = viejos[i] !== t;
    return `<li class="hueco lleno"${nuevo ? '' : ' style="animation:none"'}>${esc(t)}</li>`;
  }).join('');
  const txt = n === 0 ? 'Tu caja está vacía' : `${n} ${n === 1 ? 'pieza' : 'piezas'}`;
  $('[data-caja-cuenta]').textContent = txt;
  $('[data-caja-total]').textContent = n ? kit.money(total) : '';
  $('[data-cb-cuenta]').textContent = n ? `Tu caja · ${n} ${n === 1 ? 'pieza' : 'piezas'}` : 'Tu caja está vacía';
  $('[data-cb-total]').textContent = kit.money(total);
  $$('[data-caja-encargar]').forEach((b) => { b.disabled = unidades() === 0; });
}
$$('[data-caja-encargar]').forEach((b) => b.addEventListener('click', () => kit.carrito?.abrir()));

// arrastrar etiquetas a la caja (mouse); con el dedo, el botón Encargar de cada etiqueta
const cajaKit = $('#caja-kit');
let arr = null;
cajaKit.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0 || !esDesk()) return;
  const it = e.target.closest('.kit-item');
  if (!it || e.target.closest('button, a, .kit-qty')) return;
  e.preventDefault();
  arr = { it, x: e.clientX, y: e.clientY, mov: false, g: null };
});
addEventListener('pointermove', (e) => {
  if (!arr) return;
  if (!arr.mov && Math.hypot(e.clientX - arr.x, e.clientY - arr.y) < 6) return;
  if (!arr.mov) {
    arr.mov = true;
    arr.it.classList.add('arrastrando');
    arr.g = document.createElement('div');
    arr.g.className = 'fantasma';
    arr.g.textContent = $('.et__nom', arr.it)?.textContent || '';
    document.body.appendChild(arr.g);
  }
  arr.g.style.left = e.clientX + 'px'; arr.g.style.top = e.clientY + 'px';
  const r = caja.getBoundingClientRect();
  caja.classList.toggle('recibe', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
});
addEventListener('pointerup', () => {
  if (!arr) return;
  const { it, g, mov } = arr; arr = null;
  it.classList.remove('arrastrando'); g?.remove();
  if (mov && caja.classList.contains('recibe')) kit.carrito?.agregar(it.dataset.id, 1);
  caja.classList.remove('recibe');
});

// la barra de la caja (celu) oculta la píldora del panel mientras se ve
const cajaBarra = $('[data-caja-barra]');
new IntersectionObserver(([en]) => html.classList.toggle('caja-visible', en.isIntersecting && !esDesk()), { threshold: 0.01 }).observe($('#encargos'));

/* ---------- bolsa de café: molienda + encargar ---------- */
let molienda = 'grano';
$('[data-molienda]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mol]'); if (!b) return;
  molienda = b.dataset.mol;
  $$('[data-mol]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
});
const bolsaOk = $('[data-bolsa-ok]');
$('[data-bolsa-sumar]').addEventListener('click', (e) => {
  kit.carrito?.agregar('cafe-grano', 1, { opc: { molienda }, origen: e.currentTarget });
  bolsaOk.textContent = `Sumamos una bolsa ${molienda === 'grano' ? 'en grano' : 'molida'} a tu encargo.`;
  clearTimeout(bolsaOk._t); bolsaOk._t = setTimeout(() => { bolsaOk.textContent = ''; }, 3200);
});
const notas = $('[data-grano-notas]');
const verNotas = () => { notas.hidden = !$('[data-kit-destacado="grano.notas"]').textContent.trim(); };
document.addEventListener('kit:destacados', verNotas);
verNotas();

document.addEventListener('kit:carrito', (e) => { contar(e.detail?.delta > 0); pintarCaja(); });
kit.store.onChange(leerProductos);
kit.carrito?.listo.then(() => { contar(); leerProductos(); });

/* =========================================================
   DOS PUERTAS: sucursales, estado abierto/cerrado, mapa
   ========================================================= */
const sedes = kit.config.sucursales || [];
const hs = (h) => String(h).replace(/^0/, '');
function estadoSede(id) {
  const s = sedes.find((x) => x.id === id);
  if (!s?.horarios) return null;
  return kit.abierto(s.horarios);
}
function pintarEstados() {
  const e = estadoSede('urquiza');
  if (!e) return;
  const el = $('[data-estado="urquiza"]');
  el.textContent = e.abierto ? `¡Abierto! Hasta las ${hs(e.cierra)} hs` : (e.abre ? `Cerrado · abre ${hs(e.abre)} hs` : 'Cerrado por hoy');
  el.classList.toggle('abierto', e.abierto); el.classList.toggle('cerrado', !e.abierto);
  $('[data-estado-punto="urquiza"]')?.classList.toggle('abierto', e.abierto);
  const txt = $('[data-estado-txt="urquiza"]');
  if (txt) txt.textContent = e.abierto ? `abierto hasta ${hs(e.cierra)} hs` : (e.abre ? `abre ${hs(e.abre)} hs` : 'cerrado por hoy');
}
pintarEstados();
setInterval(pintarEstados, 60000);

const puertas = $$('.puerta');
function cargarMapa(panel) { const f = $('iframe[data-src]', panel); if (f && !f.src) f.src = f.dataset.src; }
function elegirSede(id) {
  puertas.forEach((p) => { const on = p.dataset.sede === id; p.classList.toggle('is-on', on); p.setAttribute('aria-selected', String(on)); });
  $$('[data-sede-panel]').forEach((p) => { const on = p.dataset.sedePanel === id; p.hidden = !on; if (on) cargarMapa(p); });
}
puertas.forEach((p) => p.addEventListener('click', () => elegirSede(p.dataset.sede)));
$('.puertas').addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  const i = puertas.indexOf(document.activeElement); if (i < 0) return;
  const n = puertas[(i + (e.key === 'ArrowRight' ? 1 : -1) + puertas.length) % puertas.length]; n.focus(); n.click();
});
$$('[data-sede-link]').forEach((a) => a.addEventListener('click', () => elegirSede(a.dataset.sedeLink)));
new IntersectionObserver(([en], obs) => { if (en.isIntersecting) { cargarMapa($('[data-sede-panel]:not([hidden])')); obs.disconnect(); } }, { rootMargin: '300px 0px' }).observe($('#sucursales'));

/* =========================================================
   AGENDA: anotarse por WhatsApp
   ========================================================= */
function linkEvento(a) {
  const ev = a.dataset.waEvento;
  const card = a.closest('.evento');
  const cuando = $('.evento__cuando', card)?.textContent.trim() || '';
  const texto = `¡Hola Porta Negra! Me quiero anotar en ${ev} (${cuando}). Mi nombre es: `;
  const num = String(kit.config.sucursales?.find((s) => s.id === 'saavedra')?.whatsapp || kit.config.whatsapp || '').replace(/\D/g, '');
  a.href = `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}
const pintarEventos = () => $$('[data-wa-evento]').forEach(linkEvento);
pintarEventos();
document.addEventListener('kit:destacados', pintarEventos);

/* =========================================================
   NUESTRO LUGAR: la lámpara sigue al mouse + galería con arrastre
   ========================================================= */
const lugar = $('[data-lampara]');
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
  let rafL = 0, lx = 0, ly = 0;
  lugar.addEventListener('pointermove', (e) => {
    const r = lugar.getBoundingClientRect(); lx = e.clientX - r.left; ly = e.clientY - r.top;
    if (rafL) return;
    rafL = requestAnimationFrame(() => { rafL = 0; lugar.style.setProperty('--lx', lx + 'px'); lugar.style.setProperty('--ly', ly + 'px'); });
  }, { passive: true });
  lugar.addEventListener('pointerenter', () => lugar.classList.add('encendida'));
  lugar.addEventListener('pointerleave', () => lugar.classList.remove('encendida'));
}
// galería del celu/tablet: arrastre con mouse además del dedo (en desktop es mosaico)
const gal = $('[data-galeria]');
let g = null;
gal.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || esDesk()) return;
  g = { x: e.clientX, s: gal.scrollLeft, mov: false };
});
addEventListener('pointermove', (e) => {
  if (!g) return;
  const dx = e.clientX - g.x;
  if (!g.mov && Math.abs(dx) > 4) { g.mov = true; gal.classList.add('arrastra'); }
  if (g.mov) gal.scrollLeft = g.s - dx;
});
addEventListener('pointerup', () => {
  if (!g) return;
  const mov = g.mov; g = null;
  if (mov) { gal.classList.remove('arrastra'); const w = gal.querySelector('.gal')?.offsetWidth + 12 || 1; gal.scrollTo({ left: Math.round(gal.scrollLeft / w) * w, behavior: 'smooth' }); }
});
gal.addEventListener('dragstart', (e) => e.preventDefault());
