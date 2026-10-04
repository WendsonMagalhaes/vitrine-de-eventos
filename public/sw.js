/* Service worker do site (escopo "/"): vitrine do cliente, painel do fornecedor e administração.
   - Telas (navegação): rede primeiro; sem internet, mostra a última versão guardada ou a tela offline.
   - Arquivos estáticos do Next, ícones e fontes: guardados na primeira vez e servidos do cache depois.
   - Dados públicos da vitrine (categorias, banners, fornecedores): atualiza em segundo plano e usa o cache se faltar internet.
   - Nada de conta, mensagens ou favoritos é guardado aqui: esses dados só existem com internet. */
const VERSION = "v4";
const PAGES = `vitrine-pages-${VERSION}`;
const STATIC = `vitrine-static-${VERSION}`;
const DATA = `vitrine-data-${VERSION}`;
const OFFLINE = "/offline.html";
const PUBLIC_API = [/^\/api\/categories$/, /^\/api\/banners$/, /^\/api\/providers(\/[^/]+)?$/];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PAGES, STATIC, DATA]);
    for (const k of await caches.keys()) if (k.startsWith("vitrine-") && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.headers.has("authorization")) return; // nunca guarda resposta de quem está logado
    if (req.mode === "navigate" && !url.pathname.startsWith("/api/")) return event.respondWith(pageStrategy(req));
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) return event.respondWith(cacheFirst(req, STATIC));
    if (PUBLIC_API.some((re) => re.test(url.pathname)) && !url.search.includes("q=")) return event.respondWith(staleWhileRevalidate(req, DATA));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "res.cloudinary.com") {
    event.respondWith(staleWhileRevalidate(req, STATIC));
  }
});

async function pageStrategy(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await caches.match(OFFLINE)) || Response.error();
  }
}
async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}

// Aviso de mensagem (Web Push). A API envia {title, body, conversationId, url}; "url" já é a tela certa para cada perfil.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* sem corpo */ }
  event.waitUntil((async () => {
    // Se o app está aberto e à vista, ele mesmo mostra as mensagens: não repete o aviso por cima.
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (open.some((c) => c.visibilityState === "visible" && c.focused)) return;
    await self.registration.showNotification(data.title || "Vitrine Eventos", {
      body: data.body || "", icon: "/icons/icon-192.png", badge: "/icons/favicon-32.png",
      tag: data.conversationId || "vitrine-chat", renotify: true,
      data: { url: data.url || "/app/mensagens" },
    });
  })());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app/mensagens";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if ("focus" in c) { await c.focus(); if ("navigate" in c) await c.navigate(url); return; }
    await self.clients.openWindow(url);
  })());
});
