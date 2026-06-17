// 다드림 PWA 서비스워커
// 목표: 오프라인일 때 흰 화면 대신 안내 화면을 보여주고, 정적 자산을 캐싱해 재방문을 빠르게 한다.
// 원칙: 인증·데이터(Supabase, API)는 절대 캐싱하지 않는다. 같은 출처 GET만 다룬다.

const VERSION = 'v1';
const STATIC_CACHE = `dadream-static-${VERSION}`;
const OFFLINE_URL = '/__offline';

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>오프라인 — 다드림</title>
<style>
  body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;
       font-family:system-ui,-apple-system,sans-serif;background:#1c1a1b;color:#fff;text-align:center;padding:1.5rem}
  h1{font-size:1.25rem;margin:0 0 .5rem}
  p{color:#bbb;font-size:.9rem;margin:0 0 1.5rem;line-height:1.5}
  button{padding:.6rem 1.4rem;border:0;border-radius:.6rem;background:#fff;color:#1c1a1b;font-weight:600;font-size:.9rem}
</style></head>
<body>
  <h1>오프라인 상태예요</h1>
  <p>인터넷 연결을 확인한 뒤<br/>다시 시도해주세요.</p>
  <button onclick="location.reload()">다시 시도</button>
</body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.put(OFFLINE_URL, new Response(OFFLINE_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 다른 출처(Supabase 등)는 손대지 않는다.
  if (url.origin !== self.location.origin) return;

  // 정적 빌드 자산: 캐시 우선(불변 해시 경로라 안전)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return res;
        }),
      ),
    );
    return;
  }

  // 페이지 이동: 네트워크 우선, 실패 시 오프라인 안내
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
  }
});
