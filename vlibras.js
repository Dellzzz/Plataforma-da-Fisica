/* ============================================================
   Plataforma da Física — VLibras (tradução para Libras)
   Drop-in de uma linha, no mesmo estilo do acessibilidade.js.

   Adiciona o widget OFICIAL do Governo Federal (vlibras.gov.br),
   que traduz o texto da página para a Língua Brasileira de Sinais
   por meio de um avatar. O aluno seleciona um texto e o avatar
   sinaliza.

   Como usar: coloque este arquivo na raiz do projeto e adicione,
   antes de </body> em cada página:
       <script src="/Plataforma-da-Fisica/vlibras.js"></script>
   (o script aplicar-acessibilidade.py insere isso em lote.)

   Observações:
   - Carrega de um servidor externo (vlibras.gov.br) — precisa de
     INTERNET; não funciona offline nem em file://. Teste pelo link
     publicado no GitHub Pages.
   - O botão das "mãozinhas" fica no canto inferior direito, ACIMA
     do botão do painel de acessibilidade, para não colidirem.
   ============================================================ */
(function () {
  'use strict';
  if (window.__vlibrasInstalado) return;
  window.__vlibrasInstalado = true;

  /* posiciona o botão de acesso acima do botão de acessibilidade */
  var st = document.createElement('style');
  st.textContent =
    'div[vw]{z-index:999999}' +
    'div[vw] [vw-access-button]{right:14px !important;bottom:92px !important;top:auto !important;left:auto !important}' +
    '@media(max-width:680px){div[vw] [vw-access-button]{bottom:88px !important}}';
  document.head.appendChild(st);

  /* estrutura exigida pelo VLibras */
  var root = document.createElement('div');
  root.setAttribute('vw', '');
  root.className = 'enabled';
  root.innerHTML =
    '<div vw-access-button class="active"></div>' +
    '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  (document.body || document.documentElement).appendChild(root);

  /* carrega o plugin oficial e inicializa o widget */
  function iniciar() {
    try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch (e) {}
  }
  if (window.VLibras && window.VLibras.Widget) { iniciar(); return; }
  var s = document.createElement('script');
  s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  s.async = true;
  s.onload = iniciar;
  (document.body || document.documentElement).appendChild(s);
})();
