// Nombre y versiones de las caches
const VERSION = 'v1';
const CACHE_STATIC = `rm-static-${VERSION}`;
const CACHE_API = `rm-api-${VERSION}`;
const CACHE_IMAGES = `rm-images-${VERSION}`;

// Archivos base de la aplicacion que se guardan al instalar
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

const API_HOST = 'rickandmortyapi.com';

// Guardamos los archivos estaticos iniciales
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Limpia caches viejas cuando actualizamos la version
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

// Escuchamos y filtramos todas las peticiones de la app
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo procesamos peticiones de lectura GET
    if (request.method !== 'GET') return;

    // Peticiones de datos a la API (personajes, episodios, busquedas)
    if (url.hostname === API_HOST && url.pathname.startsWith('/api/') && !url.pathname.includes('/avatar/')) {
        event.respondWith(networkFirst(request, CACHE_API));
        return;
    }

    // Imagenes de avatares de personajes
    if (url.hostname === API_HOST && url.pathname.includes('/avatar/')) {
        event.respondWith(cacheFirst(request, CACHE_IMAGES));
        return;
    }

    // Archivos propios del sitio (html, css, js)
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request, CACHE_STATIC));
        return;
    }

    // Cualquier otra cosa intenta red primero y luego cache
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// Intenta traer de la red; si hay exito guarda una copia, si falla busca en la cache
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
        return new Response(
            JSON.stringify({ error: 'Sin conexión y sin datos en caché.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Busca primero en cache; si no esta, lo descarga y lo guarda para la proxima
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
        return cachedResponse;
    }
}