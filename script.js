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


function openDetails(id, type) {
    const data = (type === 'character-modal') ? allCharacters : allEpisodes;
    const item = data.find(c => c.id === id);
    const modal = document.getElementById(type);
    
    // Inyectar HTML según el tipo
    const modalBody = modal.querySelector('#modal-body');
    if (type === 'character-modal') {
        modalBody.innerHTML = `
            <img src="${item.image}" style="width:150px; border-radius:10px;">
            <p><strong>Nombre:</strong> <input type="text" id="edit-name" value="${item.name}"></p>
        `;
    } else {
        modalBody.innerHTML = `
            <p><strong>Nombre:</strong> <input type="text" id="edit-name" value="${item.name}"></p>
            <p><strong>Episodio:</strong> ${item.episode}</p>
        `;
    }
    
    modal.style.display = 'flex';
    modal.dataset.currentId = id;
    modal.dataset.type = type; // Guardamos el tipo para saber qué guardar luego
}
function saveChanges() {
    const modal = document.querySelector('[style*="display: flex"]'); // Captura el modal abierto
    const id = modal.dataset.currentId;
    const type = modal.dataset.type;
    const newName = document.getElementById('edit-name').value;
    
    if (type === 'character-modal') {
        const char = allCharacters.find(c => c.id == id);
        char.name = newName;
        renderCharacters(allCharacters);
    } else {
        const ep = allEpisodes.find(e => e.id == id);
        ep.name = newName;
        renderEpisodes(allEpisodes);
    }
    
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
// Inicialización
window.onload = () => {
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
};