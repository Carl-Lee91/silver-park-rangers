/*
  홈 화면 앱(PWA)의 최소 서비스 워커(PLAN.md §7 "앱으로 설치").

  크롬은 fetch 처리기가 있는 서비스 워커가 있어야 설치 창을 띄운다. 그래서 하는 일은 하나뿐이다:
  화면 이동(navigate)이 인터넷 끊김으로 실패하면 "연결 안 됨" 화면을 보인다.
  데이터 · 화면은 캐시에서 꺼내 주지 않는다 — 투표 · 스쿼드는 늘 서버에서 새로 읽는다.

  고치면 CACHE 이름을 올린다(예전 캐시는 activate 에서 지운다).
*/
const CACHE = "spr-offline-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
