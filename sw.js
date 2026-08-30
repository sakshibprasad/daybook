const CACHE = "daybook-v16";
const STATIC_ASSETS = ["./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

// ---------------- Push notifications (Firebase Cloud Messaging background handling) ----------------
// This only DISPLAYS a notification when one arrives - it doesn't decide when to send one.
// That decision is made server-side (a scheduled Cloud Function), which is a separate,
// not-yet-built piece. Until that exists, this code has nothing to react to yet - it's
// just ready for when it does.
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDqaxmrzyCrG1mbeJJh_7wHnRbco5NAeRs",
  authDomain: "dailycheckin-dc2d7.firebaseapp.com",
  projectId: "dailycheckin-dc2d7",
  storageBucket: "dailycheckin-dc2d7.firebasestorage.app",
  messagingSenderId: "915397098752",
  appId: "1:915397098752:web:8f707bbee645b9a4bdc7e5"
});

try{
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload){
    var title = (payload.notification && payload.notification.title) || "Daybook";
    var body = (payload.notification && payload.notification.body) || "";
    self.registration.showNotification(title, {
      body: body,
      icon: "./icon-192.png",
      badge: "./icon-192.png"
    });
  });
}catch(e){ /* messaging not supported in this browser/context - the rest of the service worker (caching) still works fine */ }

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const isAppShell = e.request.mode === "navigate" || e.request.url.endsWith("index.html") || e.request.url.endsWith("/");

  if (isAppShell) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      });
    })
  );
});
