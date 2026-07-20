
const VERSION = 'v1';
const CACHE_STATIC = `rm-static-${VERSION}`;
const CACHE_API = `rm-api-${VERSION}`;
const CACHE_IMAGES = `rm-images-${VERSION}`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

// URLs de la API que queremos interceptar y cachear
const API_HOST = 'rickandmortyapi.com';
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});
//limpia caches antiguas al activar un nuevo service worker
self.addEventListener('activate', (event) => {
    const currentCaches = [CACHE_STATIC, CACHE_API, CACHE_IMAGES];

    event.waitUntil(
        caches.keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => !currentCaches.includes(name))
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim())
    );
});

//enruta las peticones
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo interceptamos peticiones GET
    if (request.method !== 'GET') return;

    // Peticiones a la API de personajes/episodios (listas o items individuales)
    if (url.hostname === API_HOST && url.pathname.startsWith('/api/') && !url.pathname.includes('/avatar/')) {
        event.respondWith(networkFirst(request, CACHE_API));
        return;
    }

    //  Imágenes de avatares de personajes
    if (url.hostname === API_HOST && url.pathname.includes('/avatar/')) {
        event.respondWith(cacheFirst(request, CACHE_IMAGES));
        return;
    }

    // Archivos propios del proyecto (html, css, js)
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request, CACHE_STATIC));
        return;
    }

    // Cualquier otra petición: intenta red, sin forzar cacheo
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// si la red falla intenta con la cache 
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // No hay red ni caché disponible
        return new Response(
            JSON.stringify({ error: 'Sin conexión y sin datos en caché.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Usa la caché si existe; si no, va a la red y guarda el resultado
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return cachedResponse; // undefined si tampoco había nada en caché
    }
}
