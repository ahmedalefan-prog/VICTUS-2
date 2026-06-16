// VICTUS Service Worker — تخزين الهيكل + صفحة عدم الاتصال.
// محافظ عمداً: لا يخزّن صفحات/بيانات مصادَق عليها (network-first للتنقّل)،
// ويخزّن الأصول الثابتة فقط (cache-first). لا يعترض طلبات الأصول الخارجية.
const CACHE = "victus-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // أصول خارجية: تجاهل

  // التنقّل بين الصفحات: الشبكة أولاً، وعند الفشل صفحة عدم الاتصال.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // الأصول الثابتة: التخزين أولاً ثم الشبكة (تحديث الكاش).
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
