/* ============================================================
   Plataforma da Física — MODO CALMO (baixo estímulo sensorial)
   Acessibilidade para alunos neurodiversos (TDAH / autismo).

   Como usar: coloque este arquivo na MESMA pasta das aulas e
   adicione, antes de </body> em cada página:
       <script src="./modo-calmo.js"></script>

   O que faz, quando ligado:
   - reduz brilhos, sombras e a saturação do neon (visual mais suave);
   - congela as animações automáticas (hero e simulações), mas as
     simulações VOLTAM a se mexer sozinhas enquanto o aluno arrasta
     um controle, e param de novo quando ele solta;
   - desliga o "pulsar" e a seta que balança.
   A escolha do aluno fica salva (localStorage) e vale em toda a
   plataforma. Se o sistema do aparelho já pede "reduzir movimento",
   o modo calmo começa ligado por padrão.
   ============================================================ */
(function () {
  'use strict';
  if (window.__calmoInstalado) return;        // evita rodar duas vezes
  window.__calmoInstalado = true;

  var KEY = 'plataphysica_calm';
  var root = document.documentElement;

  /* ---------- 1. controlar as animações (requestAnimationFrame) ---------- */
  var calm = false;
  var activeUntil = 0;                          // até quando as animações podem rodar
  var fila = [];                               // frames "segurados" enquanto está calmo
  var nativo = (window.requestAnimationFrame ||
                function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); }
               ).bind(window);

  window.requestAnimationFrame = function (cb) {
    if (!calm) return nativo(cb);                       // normal: roda tudo
    if (performance.now() < activeUntil) return nativo(cb); // interação recente: roda
    fila.push(cb);                                      // calmo e parado: segura o frame
    return 0;
  };
  function liberar() {
    if (!fila.length) return;
    var q = fila; fila = [];
    for (var i = 0; i < q.length; i++) nativo(q[i]);    // retoma os loops parados
  }
  function acordar() {                                  // chamado a cada interação
    if (!calm) return;
    activeUntil = performance.now() + 600;              // ~0,6s de movimento e volta a parar
    liberar();
  }
  ['pointerdown', 'pointermove', 'touchstart', 'touchmove', 'input', 'change', 'keydown']
    .forEach(function (ev) {
      document.addEventListener(ev, acordar, { passive: true, capture: true });
    });

  /* ---------- 2. estilos do modo calmo ---------- */
  var css =
  '#calmToggle{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));' +
  'z-index:55;font-family:Orbitron,system-ui,sans-serif;font-weight:700;font-size:12px;' +
  'letter-spacing:.4px;color:#cfe3ef;background:rgba(16,24,40,.86);border:1px solid rgba(255,255,255,.16);' +
  'padding:10px 14px;border-radius:24px;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
  'display:inline-flex;align-items:center;gap:7px;opacity:.85;transition:opacity .2s,background .2s,border-color .2s;' +
  'box-shadow:0 4px 16px rgba(0,0,0,.35)}' +
  '#calmToggle:hover{opacity:1}' +
  '#calmToggle:focus-visible{outline:2px solid #7fb0bd;outline-offset:2px}' +
  '#calmToggle.on{background:#22513c;border-color:#3f8f66;color:#eafff4}' +
  '@media(max-width:480px){#calmToggle{font-size:11px;padding:9px 12px}}' +
  /* --- paleta suavizada (mesmos nomes de variáveis em todas as aulas) --- */
  'html.calm{--cyan:#7ba9b4;--cyan-dim:#54727a;--aqua:#84b0bd;--blue:#8098c0;' +
  '--violet:#9186bd;--magenta:#b591b0;--green:#79c19c;--yellow:#d4c58f;--gold:#d4c58f;' +
  '--orange:#c69a72;--red:#c68a92}' +
  'html.calm *{text-shadow:none!important;box-shadow:none!important}' +
  '#calmToggle{box-shadow:0 4px 16px rgba(0,0,0,.35)!important}' +   /* mantém leve sombra no botão */
  'html.calm canvas{-webkit-filter:saturate(.5) brightness(.95);filter:saturate(.5) brightness(.95)}' +
  'html.calm #heroCanvas{opacity:.2!important}' +
  'html.calm .pulse,html.calm .scroll-cue{animation:none!important}' +
  'html.calm body::before{opacity:.4!important}' +
  'html.calm body::after{opacity:.1!important}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- 3. botão de ligar/desligar ---------- */
  var btn = document.createElement('button');
  btn.id = 'calmToggle';
  btn.type = 'button';
  btn.setAttribute('aria-pressed', 'false');

  function pintar() {
    root.classList.toggle('calm', calm);
    btn.classList.toggle('on', calm);
    btn.setAttribute('aria-pressed', calm ? 'true' : 'false');
    btn.setAttribute('aria-label', calm ? 'Desativar modo calmo' : 'Ativar modo calmo (menos estímulo visual)');
    btn.innerHTML = calm ? '\u2600\uFE0F Modo calmo: ON' : '\uD83C\uDF43 Modo calmo';
  }
  btn.addEventListener('click', function () {
    calm = !calm;
    try { localStorage.setItem(KEY, calm ? '1' : '0'); } catch (e) {}
    pintar();
    // ao alternar, deixa as simulações se ajustarem ao estado atual e depois congelarem/retomarem
    activeUntil = performance.now() + 600;
    liberar();
  });

  /* ---------- 4. estado inicial ---------- */
  var salvo = null;
  try { salvo = localStorage.getItem(KEY); } catch (e) {}
  if (salvo === null) {
    try { salvo = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '1' : '0'; }
    catch (e) { salvo = '0'; }
  }
  calm = (salvo === '1');

  function montar() {
    (document.body || root).appendChild(btn);
    pintar();
  }
  if (document.body) montar();
  else document.addEventListener('DOMContentLoaded', montar);
})();
