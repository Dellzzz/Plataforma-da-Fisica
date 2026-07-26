/* ============================================================
   Plataforma da Física — BOTÃO "VOLTAR" PADRONIZADO
   Coloca um botão de voltar à plataforma em TODA página, com o
   mesmo texto e o mesmo visual, sem precisar editar o layout.

   Como usar: coloque este arquivo na MESMA pasta do index.html
   (a raiz da plataforma) e adicione, antes de </body> em cada
   página, o caminho RELATIVO até ele:
       raiz            -> <script src="./voltar.js"></script>
       subpasta        -> <script src="../voltar.js"></script>
       subpasta/dupla  -> <script src="../../voltar.js"></script>
   (o script aplicar-acessibilidade.py já calcula isso sozinho.)

   O script se localiza sozinho, então funciona aberto direto do
   computador (file://), no GitHub Pages e com domínio próprio.

   Comportamento:
   - Na home (index.html) ele NÃO aparece.
   - Se a página já tem um botão marcado com data-voltar, ele só
     PADRONIZA o texto desse botão — não cria outro.
   - Nas demais páginas, injeta um botão flutuante "← Início".
   - Botões de navegação de seção (ex.: "← Voltar aos experimentos")
     continuam intactos.

   Para mudar o texto em TODA a plataforma, altere só a linha TEXTO.
   ============================================================ */
(function () {
  'use strict';
  if (window.__voltarInstalado) return;
  window.__voltarInstalado = true;

  var TEXTO = '\u2190 In\u00EDcio';   // <<< texto padrão do botão (← Início)

  // Descobre o endereço deste próprio script (=> onde fica a raiz).
  var meu = document.currentScript;
  if (!meu) {
    var ss = document.getElementsByTagName('script');
    for (var i = ss.length - 1; i >= 0; i--) {
      if (/voltar\.js(\?|#|$)/.test(ss[i].src)) { meu = ss[i]; break; }
    }
  }
  // HOME = index.html na mesma pasta do voltar.js (resolvido de forma absoluta)
  var HOME;
  try { HOME = new URL('index.html', meu ? meu.src : location.href).href; }
  catch (e) { HOME = 'index.html'; }

  // Esta página é a home? (compara a "pasta", ignorando index.html no fim)
  function pasta(u) {
    return u.split('#')[0].split('?')[0].replace(/index\.html$/i, '').replace(/\/+$/, '');
  }
  var ehHome = pasta(location.href) === pasta(HOME);

  function estilizar(el) {
    el.style.cssText =
      'position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:55;' +
      'font-family:Orbitron,system-ui,sans-serif;font-weight:700;font-size:12px;letter-spacing:.4px;' +
      'color:#cfe3ef;background:rgba(16,24,40,.86);border:1px solid rgba(255,255,255,.16);' +
      'padding:10px 15px;border-radius:24px;text-decoration:none;cursor:pointer;' +
      'display:inline-flex;align-items:center;gap:6px;opacity:.88;' +
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.35);' +
      'transition:opacity .2s';
    el.onmouseenter = function () { el.style.opacity = '1'; };
    el.onmouseleave = function () { el.style.opacity = '.88'; };
  }

  function run() {
    if (ehHome) return;

    var existente = document.querySelector('[data-voltar]');
    if (existente) {
      existente.textContent = TEXTO;
      if (existente.tagName === 'A') existente.setAttribute('href', HOME);
      return;
    }

    var a = document.createElement('a');
    a.href = HOME;
    a.textContent = TEXTO;
    a.id = 'btnVoltar';
    a.setAttribute('data-voltar', '');
    a.setAttribute('aria-label', 'Voltar ao início da plataforma');
    estilizar(a);
    (document.body || document.documentElement).appendChild(a);
  }

  if (document.body) run();
  else document.addEventListener('DOMContentLoaded', run);
})();
