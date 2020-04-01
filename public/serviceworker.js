const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "manifest.webmanifest",
    "index.js",
    "styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// this code installs and registers your service worker (self = service worker)
// you can check if this was successful by looking in Application tab for the static cache
self.addEventListener("install", function(evt){
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// add code to activate the service worker and remove old data from the cache
self.addEventListener("activate", function(evt){
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if(key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log("Removing old cache data", key);
                    return caches.delete(key);
                    }
                })
            );
        })
    );
        self.clients.claim();
});

// enable the service worker to intercept network requests
self.addEventListener("fetch", function(evt){
    // cache succesful requests to the API
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(caches.open(DATA_CACHE_NAME).then(cache => {
            return fetch(evt.request).then(response => {
                // if response is good then clone it and store it in cache
                if(response.status === 200){
                    cache.put(evt.request.url, response.clone());
                }
                return response;
            })
            .catch(err => {
                // if network request fails try and get from cache
                return cache.match(evt.request);
                });
            }).catch(err => console.log(err))
        );
        return;
    }
      // if the request is not for the API, serve static assets using "offline-first" approach.
  evt.respondWith(
    caches.match(evt.request).then(function(response) {
      return response || fetch(evt.request);
    })
  );
});