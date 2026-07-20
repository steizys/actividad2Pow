// Registrar el Service Worker para que todo funcione offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('Service Worker registrado con éxito:', reg.scope))
            .catch((err) => console.error('Error al registrar el Service Worker:', err));
    });
}

// Obtener usuarios guardados para el inicio de sesion
function getUsers() {
    const stored = localStorage.getItem('registeredUsers'); 
    if (stored) return JSON.parse(stored);
    
    // Usuario por defecto para pruebas
    const defaultUsers = [{ name: "Admin", email: "admin@rm.com", password: "1234" }];
    localStorage.setItem('registeredUsers', JSON.stringify(defaultUsers));
    return defaultUsers;
}

// Login de usuario
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);

    if (!found) {
        alert("Correo o contraseña incorrectos.");
        return;
    }

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('character-module').style.display = 'block';

    fetchCharacters();
});

// Registro de usuarios nuevos
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const users = getUsers();

    if (users.some(u => u.email === email)) {
        alert("Ya existe una cuenta con ese correo.");
        return;
    }

    users.push({ name, email, password });
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    alert("Cuenta creada con éxito. Ahora puedes iniciar sesión.");
    document.getElementById('register-form').reset();
    showForm('login-form');
});

// Mostrar la contraseña guardada si olvida sus datos
document.getElementById('recovery-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value;
    const messageEl = document.getElementById('recovery-message');

    const users = getUsers();
    const found = users.find(u => u.email === email);

    messageEl.style.display = 'block';

    if (found) {
        messageEl.style.color = 'var(--text-main)';
        messageEl.textContent = "Tu contraseña es: " + found.password;
    } else {
        messageEl.style.color = '#ff7675';
        messageEl.textContent = "No existe ninguna cuenta registrada con ese correo.";
    }
});

// Cerrar sesion
function logout() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('character-module').style.display = 'none';
    document.getElementById('character-modal').style.display = 'none';
    document.getElementById('episodes-module').style.display = 'none';
}

// Mantener la preferencia de modo oscuro al recargar
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

// Cambiar entre la vista de Personajes y Episodios
function showSection(sectionId) {
    document.getElementById('character-module').style.display = 'none';
    document.getElementById('episodes-module').style.display = 'none';
    
    if (sectionId === 'character-module') {
        fetchCharacters();
    } else if (sectionId === 'episodes-module') {
        fetchEpisodes();
    }
    document.getElementById(sectionId).style.display = 'block';
}

// Alternar entre formularios de login, registro y recuperacion
function showForm(formId) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('recovery-form').style.display = 'none';
    
    const messageEl = document.getElementById('recovery-message');
    messageEl.style.display = 'none';
    messageEl.textContent = '';
    
    document.getElementById(formId).style.display = 'block';
}

// Filtro instantaneo en la tabla de personajes
function filterCharacters() {
    const filter = document.getElementById('search-characters').value.toLowerCase();
    const tableBody = document.getElementById('character-body');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const nameCell = rows[i].getElementsByTagName('td')[1];
        if (nameCell) {
            const nameValue = nameCell.textContent.toLowerCase();
            rows[i].style.display = nameValue.includes(filter) ? "" : "none";
        }
    }
}

// Filtro instantaneo en la tabla de episodios
function filterEpisodes() {
    const filter = document.getElementById('search-episodes').value.toLowerCase();
    const tableBody = document.getElementById('episodes-body');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const nameCell = rows[i].getElementsByTagName('td')[1];
        if (nameCell) {
            const nameValue = nameCell.textContent.toLowerCase();
            rows[i].style.display = nameValue.includes(filter) ? "" : "none";
        }
    }
}

// Ordenamiento burbuja de columnas
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

            const xVal = x.innerHTML.toLowerCase();
            const yVal = y.innerHTML.toLowerCase();

            const xNum = parseFloat(xVal);
            const yNum = parseFloat(yVal);
            const bothNumeric = !isNaN(xNum) && !isNaN(yNum);

            if (dir == "asc") {
                if (bothNumeric ? (xNum > yNum) : (xVal > yVal)) { shouldSwitch = true; break; }
            } else if (dir == "desc") {
                if (bothNumeric ? (xNum < yNum) : (xVal < yVal)) { shouldSwitch = true; break; }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") { dir = "desc"; switching = true; }
        }
    }
}

let allCharacters = []; 
let allEpisodes = []; 

// Cargar personajes delegando el cacheo al Service Worker
async function fetchCharacters() {
    const body = document.getElementById('character-body');
    
    try {
        const res = await fetch('https://rickandmortyapi.com/api/character');
        if (!res.ok) throw new Error("Error en la respuesta");
        
        const data = await res.json();
        allCharacters = data.results;
        renderCharacters(allCharacters);
        
    } catch (error) {
        console.warn("Error de red o sin datos en cache para personajes:", error);
        body.innerHTML = "<tr><td colspan='5'>No hay datos disponibles sin conexión.</td></tr>";
    }
}

// Renderizar filas de la tabla de personajes
function renderCharacters(chars) {
    const body = document.getElementById('character-body');
    body.innerHTML = chars.map(c => `
        <tr onclick="openDetails(${c.id}, 'character-modal')" style="cursor:pointer;">
            <td>${c.id}</td><td>${c.name}</td><td>${c.species}</td><td>${c.gender}</td><td>${c.type || 'Ninguno'}</td>
        </tr>
    `).join('');
}

// Cargar episodios y hacer precarga de personajes para el SW
async function fetchEpisodes() {
    const body = document.getElementById('episodes-body');
    
    try {
        const res = await fetch('https://rickandmortyapi.com/api/episode');
        if (!res.ok) throw new Error("Error en la respuesta");

        const data = await res.json();
        allEpisodes = data.results;
        renderEpisodes(allEpisodes);

        // Precarga de todos los personajes del episodio para que el SW los cachee en segundo plano
        allEpisodes.forEach(episode => {
            if (episode.characters && episode.characters.length > 0) {
                episode.characters.forEach(async (characterUrl) => {
                    try {
                        const charRes = await fetch(characterUrl);
                        if (!charRes.ok) return;
                        const charData = await charRes.json();
                        
                        // Pedir el avatar para que el SW lo ponga en CACHE_IMAGES
                        if (charData.image) {
                            fetch(charData.image).catch(() => {});
                        }
                    } catch (e) {
                        // Evita mostrar errores si algo falla durante la precarga
                    }
                });
            }
        });
        
    } catch (error) {
        console.warn("Error de red o sin datos en cache para episodios:", error);
        body.innerHTML = "<tr><td colspan='4'>No hay datos disponibles sin conexión.</td></tr>";
    }
}

// Renderizar filas de la tabla de episodios
function renderEpisodes(eps) {
    const body = document.getElementById('episodes-body');
    body.innerHTML = eps.map(e => `
        <tr onclick="openDetails(${e.id}, 'episodes-modal')" style="cursor:pointer;">
            <td>${e.id}</td>
            <td>${e.name}</td>
            <td>${e.air_date}</td>
            <td>${e.episode}</td>
        </tr>
    `).join('');
}

// Abrir modales con los detalles
function openDetails(id, type) {
    const data = (type === 'character-modal') ? allCharacters : allEpisodes;
    const item = data.find(c => c.id === id);
    const modal = document.getElementById(type);
    
    if (type === 'character-modal') {
        const modalBody = document.getElementById('modal-body-characters');
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
                    <input type="text" id="edit-species" value="${item.species || ''}" style="margin: 4px 0 0 0;">
                </div>
                <div class="modal-field">
                    <label>Género</label>
                    <input type="text" id="edit-gender" value="${item.gender || ''}" style="margin: 4px 0 0 0;">
                </div>
                <div class="modal-field full-width">
                    <label>Subtipo / Variante</label>
                    <input type="text" id="edit-type" value="${item.type || ''}" style="margin: 4px 0 0 0;">
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

            <div style="margin-top: 15px; text-align: left;">
                <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; opacity: 0.6;">Debut del Personaje</span>
                <div id="episode-preview-container">
                    <div class="preview-card" style="justify-content: center; font-size: 0.9rem; opacity: 0.7;">
                        Cargando episodio de origen...
                    </div>
                </div>
            </div>
        `;

        if (item.episode && item.episode.length > 0) {
            fetchEpisodePreview(item.episode[0]);
        } else {
            document.getElementById('episode-preview-container').innerHTML = `
                <div class="preview-card" style="justify-content: center; opacity: 0.6;">
                    Este personaje no está registrado en ningún episodio.
                </div>`;
        }

    } else {
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
                    <input type="text" id="edit-air-date" value="${item.air_date}" style="margin: 4px 0 0 0;">
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

        // Selección aleatoria del personaje destacado
        if (item.characters && item.characters.length > 0) {
            const randomUrl = item.characters[Math.floor(Math.random() * item.characters.length)];
            fetchCharacterPreview(randomUrl);
        }
    }
    
    modal.style.display = 'flex';
    modal.dataset.currentId = id;
    modal.dataset.type = type;
}

// Cargar vista previa del episodio de debut
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

// Cargar vista previa del personaje destacado en el modal de episodio
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

// Guardar ediciones locales hechas en las modales
function saveChanges() {
    const modalCharacter = document.getElementById('character-modal');
    const modalEpisodes = document.getElementById('episodes-modal');
    
    const modal = (modalCharacter.style.display === 'flex') ? modalCharacter : modalEpisodes;
    const type = modal.id;
    
    const id = parseInt(modal.dataset.currentId);
    const newName = document.getElementById('edit-name').value;

    if (type === 'character-modal') {
        const char = allCharacters.find(c => c.id == id);
        if (char) {
            char.name = newName;
            char.species = document.getElementById('edit-species').value;
            char.gender = document.getElementById('edit-gender').value;
            char.type = document.getElementById('edit-type').value;
            renderCharacters(allCharacters);
        }
    } else {
        const ep = allEpisodes.find(e => e.id == id);
        if (ep) {
            ep.name = newName;
            ep.air_date = document.getElementById('edit-air-date').value;
            renderEpisodes(allEpisodes);
        }
    }
    modal.style.display = 'none';
}