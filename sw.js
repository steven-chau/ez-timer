var VERSION = '1.2.40';
var CACHE = 'ez-timer-v' + VERSION;

var ASSETS = [
  '/ez-timer/',
  '/ez-timer/index.html',
  '/ez-timer/css/style.css',
  '/ez-timer/js/app.js',
  '/ez-timer/js/audio.js',
  '/ez-timer/js/confetti.js',
  '/ez-timer/js/i18n.js',
  '/ez-timer/js/records.js',
  '/ez-timer/js/state.js',
  '/ez-timer/js/storage.js',
  '/ez-timer/js/timer.js',
  '/ez-timer/js/ui.js',
  '/ez-timer/js/export-import.js',
  '/ez-timer/js/vendor/qrcode-generator.min.js',
  '/ez-timer/js/vendor/jsQR.js',
  '/ez-timer/js/vendor/html5-qrcode.min.js',
  '/ez-timer/manifest.json',
  '/ez-timer/icon-192.png',
  '/ez-timer/icon-512.png',
  '/ez-timer/img/dicaprio-meme.gif',
  '/ez-timer/img/party-popper-DEL.gif'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return Promise.all(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('SW: failed to cache ' + url, err);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return clients.claim();
    }).then(function() {
      return clients.matchAll().then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({ type: 'VERSION', version: VERSION });
        });
      });
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'GET_VERSION') {
    e.source.postMessage({ type: 'VERSION', version: VERSION });
  }
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});
