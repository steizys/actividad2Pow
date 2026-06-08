function showForm(formId) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('recovery-form').style.display = 'none';
    document.getElementById(formId).style.display = 'block';
}

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

// Consumo de API
async function fetchCharacters() {
    const res = await fetch('https://rickandmortyapi.com/api/character');
    const data = await res.json();
    const body = document.getElementById('character-body');
    body.innerHTML = data.results.map(c => `
        <tr><td>${c.id}</td><td>${c.name}</td><td>${c.species}</td><td>${c.gender}</td></tr>
    `).join('');
}
function filterCharacters() {
    // 1. Obtener el valor del buscador y pasarlo a minúsculas para comparar
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
function sortTable(n) {
    const table = document.getElementById("character-table");
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
// Inicialización
window.onload = () => {
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
};