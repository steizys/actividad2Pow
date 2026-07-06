// Al hacer Login, mostramos solo lo necesario
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // Ocultar Auth
    document.getElementById('auth-container').style.display = 'none';
    
    // Mostrar Nav y Módulo
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('character-module').style.display = 'block';
    
    fetchCharacters();
});

// Función de salida (Logout)
function logout() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('character-module').style.display = 'none';
    document.getElementById('character-modal').style.display = 'none';
    document.getElementById('episodes-module').style.display = 'none';
}

// Asegurar que el switch mantenga el estado al recargar
window.onload = function() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }
};

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Lógica de Login
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('character-module').style.display = 'block';
    fetchCharacters();
});
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.getElementById('character-module').style.display = 'none';
    document.getElementById('episodes-module').style.display = 'none';
    // Mostrar la sección solicitada
    
    if (sectionId === 'character-module') {
        fetchCharacters();
    } else if (sectionId === 'episodes-module') {
        fetchEpisodes();
    }
    document.getElementById(sectionId).style.display = 'block';
}
function showForm(formId) {
    // 1. Ocultar todos los formularios dentro del contenedor de autenticación
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('recovery-form').style.display = 'none';
    
    // 2. Mostrar únicamente el formulario solicitado
    document.getElementById(formId).style.display = 'block';
}
function filterCharacters() {
    const filter = document.getElementById('search-input').value.toLowerCase();
    
    // 2. Obtener todas las filas del cuerpo de la tabla
    const tableBody = document.getElementById('character-body');
    const rows = tableBody.getElementsByTagName('tr');

    // 3. Recorrer las filas
    for (let i = 0; i < rows.length; i++) {
        // Obtenemos el nombre (que está en la segunda columna, índice 1)
        const nameCell = rows[i].getElementsByTagName('td')[1];
        
        if (nameCell) {
            const nameValue = nameCell.textContent.toLowerCase();
            
            // 4. Mostrar u ocultar la fila según la coincidencia
            if (nameValue.indexOf(filter) > -1) {
                rows[i].style.display = ""; // Se muestra
            } else {
                rows[i].style.display = "none"; // Se oculta
            }
        }
    }
}
// Función de ordenamiento
function sortTable(n, type) {
    const table = document.getElementById(type);
    let rows, switching, i, x, y, shouldSwitch, dir = "asc", switchcount = 0;
    switching = true;
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) { shouldSwitch = true; break; }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) { shouldSwitch = true; break; }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount ++;
        } else {
            if (switchcount == 0 && dir == "asc") { dir = "desc"; switching = true; }
        }
    }
}
let allCharacters = []; // Variable global para guardar datos
let allEpisodes = []; // Variable global para guardar datos de episodios
// Nueva lógica de fetch con Resiliencia
async function fetchCharacters() {
    const body = document.getElementById('character-body');
    
    try {
        // 1. Intentar conectar a la API
        const res = await fetch('https://rickandmortyapi.com/api/character');
        const data = await res.json();
        
        // 2. Guardar en localStorage para acceso offline
        localStorage.setItem('cachedCharacters', JSON.stringify(data.results));
        allCharacters = data.results;
        renderCharacters(allCharacters);
        console.log("Datos cargados desde API y guardados en caché.");
        
    } catch (error) {
        // 3. MODO OFFLINE: Si la API falla, cargar de localStorage
        console.warn("Sin conexión, cargando desde caché...");
        const cachedData = localStorage.getItem('cachedCharacters');
        
        if (cachedData) {
            allCharacters = JSON.parse(cachedData);
            renderCharacters(allCharacters);
            alert("Estás trabajando en modo offline con datos guardados.");
        } else {
            body.innerHTML = "<tr><td colspan='4'>No hay datos disponibles sin conexión.</td></tr>";
        }
    }
}

function renderCharacters(chars) {
    const body = document.getElementById('character-body');
    body.innerHTML = chars.map(c => `
        <tr onclick="openDetails(${c.id}, 'character-modal')" style="cursor:pointer;">
            <td>${c.id}</td><td>${c.name}</td><td>${c.species}</td><td>${c.gender}</td>
        </tr>
    `).join('');
}
function renderEpisodes(eps) {
    const body = document.getElementById('episodes-body');
    console.log("Renderizando episodios:", eps);
    body.innerHTML = eps.map(e => `
       
        <tr onclick="openDetails(${e.id}, 'episodes-modal')" style="cursor:pointer;">
            <td>${e.id}</td>
            <td>${e.name}</td>
            <td>${e.air_date}</td>
            <td>${e.episode}</td>
        </tr>
    `).join('');
}

function openDetails(id, type) {
    const data = (type === 'character-modal') ? allCharacters : allEpisodes;
    const item = data.find(c => c.id === id);
    const modal = document.getElementById(type);
    
    if (type === 'character-modal') {
        const modalBody = document.getElementById('modal-body-characters');
        
        // Determinar color del indicador de estado
        const statusColor = item.status === 'Alive' ? '#97ce4c' : item.status === 'Dead' ? '#ff7675' : '#style-disabled';

        modalBody.innerHTML = `
            <div class="character-modal-header">
                <img src="${item.image}" alt="${item.name}">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; width: 100%;">
                    <div class="modal-field">
                        <label>Nombre Completo</label>
                        <input type="text" id="edit-name" value="${item.name}" style="margin: 4px 0 0 0;">
                    </div>
                    <div class="modal-field">
                        <label>Estado de Vida</label>
                        <span style="font-weight: bold; color: ${statusColor}; font-size: 1.1rem;">
                            ● ${item.status === 'Alive' ? 'Vivo' : item.status === 'Dead' ? 'Muerto' : 'Desconocido'}
                        </span>
                    </div>
                </div>
            </div>

            <div class="modal-grid">
                <div class="modal-field">
                    <label>Especie</label>
                    <span>${item.species || 'No especificada'}</span>
                </div>
                <div class="modal-field">
                    <label>Género</label>
                    <span>${item.gender || 'No especificado'}</span>
                </div>
                <div class="modal-field full-width">
                    <label>Subtipo / Variante</label>
                    <span>${item.type || 'Ninguno (Normal)'}</span>
                </div>
                <div class="modal-field">
                    <label>Origen</label>
                    <span>${item.origin && item.origin.name ? item.origin.name : 'Desconocido'}</span>
                </div>
                <div class="modal-field">
                    <label>Ubicación Actual</label>
                    <span>${item.location && item.location.name ? item.location.name : 'Desconocida'}</span>
                </div>
                <div class="modal-field full-width">
                    <label>Apariciones en Pantalla</label>
                    <span>Presente en ${item.episode ? item.episode.length : 0} episodios</span>
                </div>
            </div>

            <!-- Preview Dinámico: Primer episodio en el que debutó -->
            <div style="margin-top: 15px; text-align: left;">
                <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; opacity: 0.6;">Debut del Personaje</span>
                <div id="episode-preview-container">
                    <div class="preview-card" style="justify-content: center; font-size: 0.9rem; opacity: 0.7;">
                        Cargando episodio de origen...
                    </div>
                </div>
            </div>
        `;

        // Hacer fetch al primer episodio del arreglo (debut)
        if (item.episode && item.episode.length > 0) {
            fetchEpisodePreview(item.episode[0]);
        } else {
            document.getElementById('episode-preview-container').innerHTML = `
                <div class="preview-card" style="justify-content: center; opacity: 0.6;">
                    Este personaje no está registrado en ningún episodio.
                </div>`;
        }

    } else {
        // Lógica de episodios (mantén la que hicimos en el paso anterior)
        const modalBody = document.getElementById('modal-body-episodes');
        const creationDate = new Date(item.created).toLocaleString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        modalBody.innerHTML = `
            <div class="modal-field full-width">
                <label>Nombre del Episodio</label>
                <input type="text" id="edit-name" value="${item.name}" style="margin: 4px 0 0 0;">
            </div>
            <div class="modal-grid">
                <div class="modal-field">
                    <label>ID de Registro</label>
                    <span>#${item.id}</span>
                </div>
                <div class="modal-field">
                    <label>Código de Episodio</label>
                    <span style="font-family: monospace; font-weight: bold; color: var(--accent);">${item.episode}</span>
                </div>
                <div class="modal-field">
                    <label>Fecha de Estreno</label>
                    <span>${item.air_date}</span>
                </div>
                <div class="modal-field">
                    <label>Total Personajes</label>
                    <span>${item.characters ? item.characters.length : 0} presentes</span>
                </div>
                <div class="modal-field full-width">
                    <label>Fecha del Sistema (created)</label>
                    <span style="font-size: 0.85rem;">${creationDate}</span>
                </div>
                <div class="modal-field full-width">
                    <label>URL de la API</label>
                    <a href="${item.url}" target="_blank" style="font-size: 0.8rem; word-break: break-all; color: var(--accent); font-family: monospace;">${item.url}</a>
                </div>
            </div>
            <div style="margin-top: 15px; text-align: left;">
                <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; opacity: 0.6;">Personaje Destacado</span>
                <div id="character-preview-container">
                    <div class="preview-card" style="justify-content: center; font-size: 0.9rem; opacity: 0.7;">
                        Cargando personaje...
                    </div>
                </div>
            </div>
        `;

        if (item.characters && item.characters.length > 0) {
            const randomUrl = item.characters[Math.floor(Math.random() * item.characters.length)];
            fetchCharacterPreview(randomUrl);
        }
    }
    
    modal.style.display = 'flex';
    modal.dataset.currentId = id;
    modal.dataset.type = type;
}

// Nueva función complementaria para traer los datos del episodio en la vista de personajes
async function fetchEpisodePreview(url) {
    const container = document.getElementById('episode-preview-container');
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const ep = await res.json();
        
        container.innerHTML = `
            <div class="preview-card">
                <div style="background: var(--accent); padding: 10px; border-radius: 8px; border: 2px solid #000; font-weight: 900; font-family: monospace; font-size: 1.1rem; color: #000; min-width: 60px; text-align: center;">
                    ${ep.episode}
                </div>
                <div class="preview-info">
                    <span style="font-weight: 800; font-size: 1.05rem;">${ep.name}</span>
                    <span style="font-size: 0.85rem; opacity: 0.8;">📅 Estreno: ${ep.air_date}</span>
                    <span style="font-size: 0.75rem; opacity: 0.6;">🎬 Primer avistamiento en el show</span>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <div class="preview-card" style="justify-content: center; color: #ff7675;">
                No se pudo cargar el preview del episodio (Modo Offline).
            </div>
        `;
    }
}

// Nueva función complementaria para traer los datos del preview
async function fetchCharacterPreview(url) {
    const container = document.getElementById('character-preview-container');
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const char = await res.json();
        
        container.innerHTML = `
            <div class="preview-card">
                <img src="${char.image}" alt="${char.name}">
                <div class="preview-info">
                    <span style="font-weight: 800; font-size: 1.05rem;">${char.name}</span>
                    <span style="font-size: 0.85rem; opacity: 0.8;">🧬 ${char.species} — 👤 ${char.gender}</span>
                    <span style="font-size: 0.8rem; color: ${char.status === 'Alive' ? '#97ce4c' : char.status === 'Dead' ? '#ff7675' : '#ccc'}; font-weight: bold;">
                        ● ${char.status === 'Alive' ? 'Vivo' : char.status === 'Dead' ? 'Muerto' : 'Desconocido'}
                    </span>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <div class="preview-card" style="justify-content: center; color: #ff7675;">
                No se pudo cargar la vista previa (Modo Offline).
            </div>
        `;
    }
}

function saveChanges() {
    // 1. Identificar qué modal está visible
    const modalCharacter = document.getElementById('character-modal');
    const modalEpisodes = document.getElementById('episodes-modal');
    
    // Determinamos cuál es el modal activo
    const modal = (modalCharacter.style.display === 'flex') ? modalCharacter : modalEpisodes;
    const type = modal.id; // 'character-modal' o 'episodes-modal'
    
    // 2. Obtener los datos
    const id = parseInt(modal.dataset.currentId);
    const newName = document.getElementById('edit-name').value;
    
    console.log(`Guardando en ${type}, ID: ${id}, Nombre: ${newName}`);

    // 3. Lógica de guardado
    if (type === 'character-modal') {
        const char = allCharacters.find(c => c.id == id);
        if (char) {
            char.name = newName;
            renderCharacters(allCharacters);
        }
    } else {
        const ep = allEpisodes.find(e => e.id == id);
        if (ep) {
            ep.name = newName;
            renderEpisodes(allEpisodes);
        }
    }
    
    // 4. Cerrar el modal correcto
    modal.style.display = 'none';
}

async function fetchEpisodes() {
    const body = document.getElementById('episodes-body');
    
    try {
        // 1. Intentar conectar a la API
        const res = await fetch('https://rickandmortyapi.com/api/episode');
        const data = await res.json();
        
        // 2. Guardar en localStorage para acceso offline
        localStorage.setItem('cachedEpisodes', JSON.stringify(data.results));
        allEpisodes = data.results;
        renderEpisodes(allEpisodes);
        console.log("Datos cargados desde API y guardados en caché.");
        
    } catch (error) {
        // 3. MODO OFFLINE: Si la API falla, cargar de localStorage
        console.warn("Sin conexión, cargando desde caché...");
        const cachedData = localStorage.getItem('cachedEpisodes');
        
        if (cachedData) {
            allEpisodes = JSON.parse(cachedData);
            renderEpisodes(allEpisodes);
            alert("Estás trabajando en modo offline con datos guardados.");
        } else {
            body.innerHTML = "<tr><td colspan='4'>No hay datos disponibles sin conexión.</td></tr>";
        }
    }
}

// Inicialización
window.onload = () => {
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
};