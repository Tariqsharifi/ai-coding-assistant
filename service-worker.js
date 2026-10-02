const CACHE_NAME = "ai-assistant-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(urlsToCache).then(() =>
        // صفحه چت آفلاین؛ اگر به هر دلیل نبود، نصب سرویس‌ورکر خراب نشود
        cache.add("./offline.html").catch(() => {})
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتژی "اول شبکه": همیشه نسخه‌ی تازه رو از اینترنت بگیر،
// فقط اگر آفلاین بودی از کش قدیمی استفاده کن
self.addEventListener("fetch", (event) => {
  // فایل‌های سنگین مدل AI آفلاین را دست نمی‌زنیم (خود مرورگر کش می‌کند)
  try {
    const host = new URL(event.request.url).hostname;
    if (host === "huggingface.co" || host.endsWith(".huggingface.co") ||
        host === "hf.co" || host.endsWith(".hf.co")) {
      return;
    }
  } catch (e) {}

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
