/* ============================================================
   Plataforma da Física — PAINEL DE ACESSIBILIDADE
   Um só botão flutuante que abre um painel com:
     • ← Início           (voltar à plataforma)
     • Modo calmo         (baixo estímulo sensorial)
     • Modo foco          (uma seção por vez; só nas aulas)
     • Ler em voz alta    (voz do navegador, em pt-BR)
     • Tamanho do texto   (A- / A / A+)

   Substitui os antigos modo-calmo.js e voltar.js (um arquivo só).

   Como usar: coloque este arquivo na raiz da plataforma e
   adicione, antes de </body> em cada página:
       <script src="/Plataforma-da-Fisica/acessibilidade.js"></script>
   (o script aplicar-acessibilidade.py faz isso em lote.)

   O botão se localiza sozinho, então o "← Início" funciona em
   qualquer subpasta. As preferências ficam salvas e valem em
   toda a plataforma. Para mudar o texto do "voltar", veja TXT_VOLTAR.
   ============================================================ */
(function () {
  'use strict';
  if (window.__axInstalado) return;
  window.__axInstalado = true;

  var TXT_VOLTAR = '\u2190 In\u00EDcio';   // ← Início
  var KEY = 'plataphysica_ax';

  /* ---------- localização: onde fica a home ---------- */
  var meu = document.currentScript;
  if (!meu) {
    var ss = document.getElementsByTagName('script');
    for (var i = ss.length - 1; i >= 0; i--) {
      if (/acessibilidade\.js(\?|#|$)/.test(ss[i].src)) { meu = ss[i]; break; }
    }
  }
  var HOME;
  try { HOME = new URL('index.html', meu ? meu.src : location.href).href; }
  catch (e) { HOME = 'index.html'; }
  function pasta(u) { return u.split('#')[0].split('?')[0].replace(/index\.html$/i, '').replace(/\/+$/, ''); }
  var ehHome = pasta(location.href) === pasta(HOME);

  /* ---------- estado salvo ---------- */
  var estado;
  try { estado = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { estado = {}; }
  if (estado.calmo === undefined) {
    try { estado.calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { estado.calmo = false; }
  }
  if (estado.fonte === undefined) estado.fonte = 1;
  estado.foco = !!estado.foco;    // leitura em voz nunca é salva
  function salvar() { try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) {} }

  /* ---------- 1) MODO CALMO: congela animações ---------- */
  var activeUntil = 0, fila = [];
  var nativo = (window.requestAnimationFrame ||
    function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); }).bind(window);
  window.requestAnimationFrame = function (cb) {
    if (!estado.calmo) return nativo(cb);
    if (performance.now() < activeUntil) return nativo(cb);
    fila.push(cb); return 0;
  };
  function liberar() { if (!fila.length) return; var q = fila; fila = []; for (var i = 0; i < q.length; i++) nativo(q[i]); }
  function acordar() { if (!estado.calmo) return; activeUntil = performance.now() + 600; liberar(); }
  ['pointerdown', 'pointermove', 'touchstart', 'touchmove', 'input', 'change', 'keydown']
    .forEach(function (ev) { document.addEventListener(ev, acordar, { passive: true, capture: true }); });

  /* ---------- 2) MODO FOCO: destaca a seção em foco ---------- */
  var secoes = [];
  function atualizarFoco() {
    if (!estado.foco) return;
    if (!secoes.length) secoes = [].slice.call(document.querySelectorAll('.lesson'));
    if (!secoes.length) return;
    var meio = window.innerHeight / 2, melhor = null, dist = 1e9;
    secoes.forEach(function (s) {
      var r = s.getBoundingClientRect(), c = r.top + r.height / 2, d = Math.abs(c - meio);
      if (d < dist) { dist = d; melhor = s; }
    });
    secoes.forEach(function (s) { s.classList.toggle('ax-foco-ativo', s === melhor); });
  }
  var tick = false;
  window.addEventListener('scroll', function () {
    if (!estado.foco || tick) return;
    tick = true; nativo(function () { atualizarFoco(); tick = false; });
  }, { passive: true });
  function temSecoes() { return !!document.querySelector('.lesson'); }

  /* ---------- 3) LER EM VOZ ALTA ---------- */
  var TEM_VOZ = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
  var vozPT = null, lendo = false, filaFala = [], idxFala = 0;
  function carregarVoz() {
    try {
      var vs = speechSynthesis.getVoices();
      vozPT = vs.filter(function (v) { return /pt[-_]?BR/i.test(v.lang); })[0]
           || vs.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
    } catch (e) {}
  }
  if (TEM_VOZ) { carregarVoz(); try { speechSynthesis.onvoiceschanged = carregarVoz; } catch (e) {} }
  function textoDaPagina() {
    // Lê TODO o texto visível do conteúdo (inclui alternativas em <span>,
    // caixas .note, mapas etc.). innerText já ignora o que está escondido
    // (ex.: resoluções fechadas) e respeita a ordem de leitura.
    var main = document.querySelector('main');
    var alvos = [];
    if (main) {
      alvos.push(main);
    } else {
      var kids = document.body.children;
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k.id === 'axRoot') continue;
        if (k.tagName === 'SCRIPT' || k.tagName === 'STYLE' || k.tagName === 'NOSCRIPT') continue;
        if (k.classList && (k.classList.contains('topbar') || k.classList.contains('toc'))) continue;
        alvos.push(k);
      }
    }
    var partes = [];
    for (var j = 0; j < alvos.length; j++) {
      var t = (alvos[j].innerText || '').trim();
      if (t) partes.push(t);
    }
    return partes.join('\n');
  }
  function falarProxima() {
    if (!lendo || idxFala >= filaFala.length) { lendo = false; pintar(); return; }
    var t = (filaFala[idxFala++] || '').trim();
    if (!t) { falarProxima(); return; }
    var u = new SpeechSynthesisUtterance(t);
    u.lang = 'pt-BR'; u.rate = 1;
    if (vozPT) u.voice = vozPT;
    u.onend = falarProxima;
    u.onerror = function () { lendo = false; pintar(); };
    speechSynthesis.speak(u);
  }
  function alternarLeitura() {
    if (!TEM_VOZ) return;
    if (lendo) { pararLeitura(); return; }
    var txt = textoDaPagina(); if (!txt) return;
    filaFala = txt.match(/[^.!?\n]+[.!?]?/g) || [txt];
    idxFala = 0; lendo = true; pintar();
    try { speechSynthesis.cancel(); } catch (e) {}
    falarProxima();
  }
  function pararLeitura() { try { speechSynthesis.cancel(); } catch (e) {} lendo = false; pintar(); }
  window.addEventListener('beforeunload', function () { try { speechSynthesis.cancel(); } catch (e) {} });

  /* ---------- 4) TAMANHO DO TEXTO (zoom da página) ---------- */
  function aplicarFonte() {
    var f = estado.fonte || 1;
    try { document.body.style.zoom = f; } catch (e) {}
    if (elFonteBtns) for (var i = 0; i < elFonteBtns.length; i++) {
      var b = elFonteBtns[i];
      b.classList.toggle('ax-fon-on', parseFloat(b.getAttribute('data-fs')) === f);
    }
  }

  /* ---------- estilos ---------- */
  var css =
  '#axRoot{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:56;' +
  'font-family:Orbitron,system-ui,sans-serif}' +
  '#axBtn{width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.18);' +
  'background:rgba(16,24,40,.9);color:#cfe3ef;cursor:pointer;display:grid;place-items:center;' +
  '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.4);' +
  'transition:transform .15s,border-color .2s}' +
  '#axBtn:hover{transform:translateY(-2px);border-color:rgba(0,229,255,.5)}' +
  '#axBtn:focus-visible{outline:2px solid #7fb0bd;outline-offset:2px}' +
  '#axPanel{position:absolute;right:0;bottom:62px;width:236px;background:#0f1728;' +
  'border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:10px;' +
  'box-shadow:0 12px 40px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:6px}' +
  '#axPanel[hidden]{display:none}' +
  '#axPanel h4{font-size:11px;letter-spacing:.6px;color:#7fa6bf;text-transform:uppercase;' +
  'margin:2px 4px 4px;font-weight:700}' +
  '.ax-item{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;' +
  'font-family:Rajdhani,system-ui,sans-serif;font-weight:600;font-size:15px;color:#dbe6f5;' +
  'background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;' +
  'padding:11px 12px;cursor:pointer;text-decoration:none;text-align:left;transition:background .15s,border-color .15s}' +
  '.ax-item:hover{background:rgba(0,229,255,.08);border-color:rgba(0,229,255,.3)}' +
  '.ax-item:focus-visible{outline:2px solid #7fb0bd;outline-offset:1px}' +
  '.ax-item .ax-sw{width:34px;height:19px;border-radius:20px;background:rgba(255,255,255,.15);' +
  'position:relative;flex:none;transition:background .2s}' +
  '.ax-item .ax-sw::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;' +
  'border-radius:50%;background:#cfe3ef;transition:left .2s}' +
  '.ax-item.ax-on .ax-sw{background:#27e88a}' +
  '.ax-item.ax-on .ax-sw::after{left:17px;background:#04121a}' +
  '.ax-item.ax-voltar{color:#eafcff;background:rgba(0,229,255,.1);border-color:rgba(0,229,255,.28)}' +
  '#axLer.ax-on{color:#04121a;background:#ffd23d;border-color:#ffd23d}' +
  '.ax-fonte{cursor:default}.ax-fonte:hover{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.08)}' +
  '.ax-fbtns{display:flex;gap:4px;flex:none}' +
  '.ax-fbtns button{width:32px;height:29px;border-radius:8px;border:1px solid rgba(255,255,255,.14);' +
  'background:rgba(255,255,255,.04);color:#dbe6f5;font-family:Orbitron,sans-serif;font-weight:700;' +
  'cursor:pointer;font-size:12px;line-height:1;padding:0}' +
  '.ax-fbtns button:hover{border-color:rgba(0,229,255,.4)}' +
  '.ax-fbtns button.ax-fon-on{background:#00e5ff;color:#04121a;border-color:#00e5ff}' +
  /* ---- MODO CALMO ---- */
  'html.ax-calm{--cyan:#7ba9b4;--cyan-dim:#54727a;--aqua:#84b0bd;--blue:#8098c0;--violet:#9186bd;' +
  '--magenta:#b591b0;--green:#79c19c;--yellow:#d4c58f;--gold:#d4c58f;--orange:#c69a72;--red:#c68a92}' +
  'html.ax-calm *{text-shadow:none!important;box-shadow:none!important}' +
  '#axRoot #axBtn,#axRoot #axPanel{box-shadow:0 6px 20px rgba(0,0,0,.4)!important}' +
  'html.ax-calm canvas{-webkit-filter:saturate(.5) brightness(.95);filter:saturate(.5) brightness(.95)}' +
  'html.ax-calm #heroCanvas{opacity:.2!important}' +
  'html.ax-calm .pulse,html.ax-calm .scroll-cue{animation:none!important}' +
  'html.ax-calm body::before{opacity:.4!important}html.ax-calm body::after{opacity:.1!important}' +
  /* ---- MODO FOCO ---- */
  'html.ax-foco .lesson{opacity:.26;transition:opacity .35s ease}' +
  'html.ax-foco .lesson.ax-foco-ativo{opacity:1}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- painel (DOM) ---------- */
  var raiz = document.createElement('div'); raiz.id = 'axRoot';
  var btn = document.createElement('button'); btn.id = 'axBtn'; btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Abrir op\u00E7\u00F5es de acessibilidade');
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round"><line x1="4" y1="8" x2="20" y2="8"/>' +
    '<circle cx="9" cy="8" r="2.4" fill="#0f1728"/><line x1="4" y1="16" x2="20" y2="16"/>' +
    '<circle cx="15" cy="16" r="2.4" fill="#0f1728"/></svg>';

  var painel = document.createElement('div'); painel.id = 'axPanel'; painel.setAttribute('role', 'menu'); painel.hidden = true;
  var h = '<h4>Acessibilidade</h4>';
  if (!ehHome) h += '<a class="ax-item ax-voltar" id="axVoltar" href="' + HOME + '">' + TXT_VOLTAR + '</a>';
  h += '<button class="ax-item" id="axCalmo" type="button" role="menuitemcheckbox" aria-checked="false">' +
       '<span>\uD83C\uDF43 Modo calmo</span><span class="ax-sw"></span></button>';
  if (temSecoes()) h += '<button class="ax-item" id="axFoco" type="button" role="menuitemcheckbox" aria-checked="false">' +
       '<span>\uD83C\uDFAF Modo foco</span><span class="ax-sw"></span></button>';
  if (TEM_VOZ) h += '<button class="ax-item" id="axLer" type="button">\uD83D\uDD0A Ler em voz alta</button>';
  h += '<div class="ax-item ax-fonte"><span>Tamanho do texto</span><span class="ax-fbtns">' +
       '<button type="button" data-fs="0.9" aria-label="Texto menor">A-</button>' +
       '<button type="button" data-fs="1" aria-label="Texto padr\u00E3o">A</button>' +
       '<button type="button" data-fs="1.25" aria-label="Texto maior">A+</button></span></div>';
  painel.innerHTML = h;

  raiz.appendChild(painel); raiz.appendChild(btn);
  (document.body || document.documentElement).appendChild(raiz);

  var elCalmo = document.getElementById('axCalmo');
  var elFoco = document.getElementById('axFoco');
  var elLer = document.getElementById('axLer');
  var elFonteBtns = painel.querySelectorAll('.ax-fbtns button');

  /* ---------- pintar estados ---------- */
  function pintar() {
    if (elCalmo) { elCalmo.classList.toggle('ax-on', !!estado.calmo); elCalmo.setAttribute('aria-checked', estado.calmo ? 'true' : 'false'); }
    if (elFoco) { elFoco.classList.toggle('ax-on', !!estado.foco); elFoco.setAttribute('aria-checked', estado.foco ? 'true' : 'false'); }
    if (elLer) { elLer.classList.toggle('ax-on', lendo); elLer.innerHTML = lendo ? '\u23F9 Parar leitura' : '\uD83D\uDD0A Ler em voz alta'; }
  }
  function aplicarCalmo() {
    document.documentElement.classList.toggle('ax-calm', !!estado.calmo);
    if (estado.calmo) { activeUntil = performance.now() + 600; liberar(); } else { liberar(); }
    pintar();
  }
  function aplicarFoco() {
    document.documentElement.classList.toggle('ax-foco', !!estado.foco);
    if (estado.foco) atualizarFoco();
    else secoes.forEach(function (s) { s.classList.remove('ax-foco-ativo'); });
    pintar();
  }

  if (elCalmo) elCalmo.addEventListener('click', function () { estado.calmo = !estado.calmo; salvar(); aplicarCalmo(); });
  if (elFoco) elFoco.addEventListener('click', function () { estado.foco = !estado.foco; salvar(); aplicarFoco(); });
  if (elLer) elLer.addEventListener('click', alternarLeitura);
  for (var k = 0; k < elFonteBtns.length; k++) {
    elFonteBtns[k].addEventListener('click', function () {
      estado.fonte = parseFloat(this.getAttribute('data-fs')); salvar(); aplicarFonte();
    });
  }

  /* ---------- abrir/fechar painel ---------- */
  function abrir(v) { painel.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); abrir(painel.hidden); });
  document.addEventListener('click', function (e) { if (!raiz.contains(e.target)) abrir(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrir(false); });

  /* ---------- aplicar preferências salvas ---------- */
  aplicarCalmo();
  aplicarFoco();
  aplicarFonte();
})();
