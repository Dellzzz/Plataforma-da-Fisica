// sw.js  —  Service Worker da Plataforma da Física
// Troque a versão (v1 -> v2 -> v3...) sempre que quiser forçar
// uma atualização geral nos aparelhos dos alunos.
const CACHE = 'plataphysica-v3';

// Páginas essenciais pré-carregadas já na instalação.
// O RESTANTE (cada aula, jogo, planetário) é guardado em cache
// automaticamente conforme o aluno navega — não precisa listar tudo aqui.
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Área ENEM + aulas interativas
  './area-enem.html',
  './area enem/eletrodinamica-enem.html',
  './area enem/mecanica-enem.html',
  './area enem/ondulatoria-enem.html',
  './area enem/termodinamica-enem.html',
  './area enem/eletromagnetismo-enem.html',
  './area enem/optica-enem.html',
  './area enem/hidrostatica-enem.html'
];

// Instalação: pré-carrega o "esqueleto" do app
self.addEventListener('install', (event) => {
  event.waitUntil(
    // allSettled: se um arquivo ainda não existir no servidor, ele é
    // ignorado sem quebrar o cache dos demais.
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Ativação: apaga caches de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: stale-while-revalidate
// -> entrega o cache NA HORA (rápido e funciona offline / internet ruim)
// -> e busca a versão nova em segundo plano para a próxima visita
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fromNetwork = fetch(request)
          .then((response) => {
            // guarda a cópia mais recente (inclui CDNs com CORS, ex. cdnjs)
            cache.put(request, response.clone()).catch(() => {});
            return response;
          })
          .catch(() => {
            // offline e sem cache: se for navegação, cai no index
            if (request.mode === 'navigate') return cache.match('./index.html');
            return cached;
          });
        return cached || fromNetwork;
      })
    )
  );
});
