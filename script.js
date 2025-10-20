// Variables globales
let vhsData = [];
let currentVHS = null;
let currentEvent = null;
let isEditingVHS = false;
let isEditingEvent = false;
let tags = []; // Array para almacenar tags personalizados
let nextTagId = 1; // Contador para generar IDs únicos de tags
let currentEditingTag = null; // Tag que se está editando actualmente

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadVHSData();
    setupEventListeners();
    setupSearch();
    setupViewMode();
    initializeTags(); // Inicializar sistema de tags
    renderTagsFilter(); // Renderizar filtro de tags
});

// Configuración de event listeners
function setupEventListeners() {
    // Formulario de VHS
    document.getElementById('vhsForm').addEventListener('submit', handleVHSSubmit);
    
    // Formulario de eventos
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
    
    // Formulario de crear tag
    document.getElementById('createTagForm').addEventListener('submit', handleCreateTagSubmit);
    
    // Formulario de edición de tags
    document.getElementById('editTagForm').addEventListener('submit', handleEditTagSubmit);
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Configuración de búsqueda
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        applyFilters(); // Usar la nueva función de filtros combinados
    });
}

// Configuración de vista
function setupViewMode() {
    // Cargar vista guardada o usar cuadrícula por defecto
    const savedViewMode = localStorage.getItem('viewMode') || 'grid';
    document.getElementById('viewMode').value = savedViewMode;
    applyViewMode(savedViewMode);
}

// Cargar datos del CSV
function loadVHSData() {
    // Intentar cargar desde localStorage primero
    const savedData = localStorage.getItem('vhsData');
    if (savedData) {
        vhsData = JSON.parse(savedData);
        renderVHSGrid();
        return;
    }
    
    // Si no hay datos guardados, cargar datos de ejemplo
    loadSampleData();
}

// Función para limpiar localStorage y recargar datos
function clearLocalStorage() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos guardados? Esto permitirá cargar el nuevo archivo CSV.')) {
        // Limpiar localStorage
        localStorage.removeItem('vhsData');
        localStorage.removeItem('currentFileName');
        
        // Limpiar la variable global
        vhsData = [];
        
        // Limpiar la interfaz visual
        renderVHSGrid();
        
        // Mostrar mensaje de confirmación
        alert('Datos limpiados exitosamente. Ahora puedes importar un nuevo archivo CSV.');
    }
}

// Función auxiliar para parsear CSV correctamente
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Parsear datos CSV
function parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    console.log('Headers detectados:', headers);
    
    vhsData = [];
    const vhsMap = new Map();
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        console.log(`Fila ${i}:`, row); // Debug
        
        const videoNombre = row.Nombre_de_la_cinta;
        
        if (!vhsMap.has(videoNombre)) {
            vhsMap.set(videoNombre, {
                video_nombre: videoNombre,
                video_duracion_total: row.Duracion_total_cinta,
                video_fecha_inicio: row.Fecha_inicio_grabacion,
                video_fecha_termino: row.Fecha_termino_grabacion,
                video_formato: row.Formato_cinta,
                video_velocidad: row.Velocidad_cinta,
                youtube_link: row.YouTube_Link || '',
                eventos: []
            });
        }
        
        if (row.Contenido && row.Contenido.trim() !== '') {
            // Convertir nombres o códigos de tags a códigos si es posible
            let eventoTags = [];
            if (row.Tags && row.Tags.trim() !== '') {
                // Dividir por comas y limpiar espacios, filtrar valores vacíos
                const tagValues = row.Tags.split('|')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0); // Filtrar tags vacíos
                
                console.log(`Tags raw para "${row.Contenido}":`, row.Tags);
                console.log('Tags divididos:', tagValues);
                
                eventoTags = tagValues.map(tagValue => {
                    // Primero buscar por código exacto (string)
                    let tag = tags.find(t => t.code === tagValue);
                    if (!tag) {
                        // Si no se encuentra por código, buscar por nombre
                        tag = tags.find(t => t.name === tagValue);
                    }
                    if (!tag) {
                        // Si tampoco se encuentra por nombre, buscar por código numérico
                        tag = tags.find(t => t.code === tagValue.toString());
                    }
                    
                    console.log(`Tag "${tagValue}" -> encontrado:`, tag ? `${tag.name} (${tag.code})` : 'NO ENCONTRADO');
                    return tag ? tag.code : tagValue; // Si no se encuentra, mantener el valor original
                });
                
                // Log para debugging
                console.log(`Evento "${row.Contenido}" - Tags finales:`, eventoTags);
            }
            
            vhsMap.get(videoNombre).eventos.push({
                evento_fecha: row.Fecha_contenido || '',
                evento_contenido: row.Contenido,
                evento_inicio: row.Inicio || '',
                evento_termino: row.Termino || '',
                evento_duracion: row.Duracion_segmento || '',
                tags: eventoTags
            });
        }
    }
    
    vhsData = Array.from(vhsMap.values());
}

// Cargar datos de ejemplo
function loadSampleData() {
    const csvData = `Nombre_de_la_cinta,Fecha_inicio_grabacion,Fecha_termino_grabacion,Duracion_total_cinta,Formato_cinta,Velocidad_cinta,YouTube_Link,Fecha_contenido,Contenido,Inicio,Termino,Duracion_segmento,Tags
Video 2,20/07/1999,27/10/1999,02:26:47,8mm,SP,https://www.youtube.com/watch?v=ejemplo1,20/07/1999,Mi Mama en la Clinica Las Lilas,00:00:00,00:09:54,00:09:54,1,2
Video 2,20/07/1999,27/10/1999,02:26:47,8mm,SP,https://www.youtube.com/watch?v=ejemplo1,25/07/1999,Visita de la Ita y Juegos en Padre Hurtado,00:09:54,00:16:48,00:06:54,3
Video 2,20/07/1999,27/10/1999,02:26:47,8mm,SP,https://www.youtube.com/watch?v=ejemplo1,02/08/1999,Primer uso del Tripode mi Primera Grabacion,00:16:48,00:19:10,00:02:22,1
Video 3,25/09/1999,18/11/1999,02:00:00,8mm,SP,https://www.youtube.com/watch?v=ejemplo2,25/09/1999,Bautizo de la Kiara,00:00:00,00:24:04,00:24:04,4
Video 3,25/09/1999,18/11/1999,02:00:00,8mm,SP,https://www.youtube.com/watch?v=ejemplo2,25/09/1999,Fiesta en la casa de la Tia Maiga,00:24:04,01:43:41,01:19:37,4,5
Video 9,29/11/1999,31/12/1999,02:01:37,8mm,SP,,29/11/1999,EL Arbol de Pascua,00:00:00,00:02:07,00:02:07,6
Video 9,29/11/1999,31/12/1999,02:01:37,8mm,SP,,04/12/1999,Fiesta de INDURA del Parque Hollywood,00:02:07,00:23:44,00:21:37,6,7
Video 9,29/11/1999,31/12/1999,02:01:37,8mm,SP,,24/12/1999,Navidad 1999,00:23:44,01:01:36,00:37:52,6,8
Video 9,29/11/1999,31/12/1999,02:01:37,8mm,SP,,25/12/1999,En Padre Hurtado al otro dia de la pascua,01:01:36,01:06:39,00:05:03,6,9
Video 9,29/11/1999,31/12/1999,02:01:37,8mm,SP,,26/12/1999,Fuegos Artificiales en el Mall Paza Oeste,01:06:39,01:45:15,00:38:36,6,10`;

    parseCSVData(csvData);
    renderVHSGrid();
}

// Renderizar grid de VHS
function renderVHSGrid() {
    const grid = document.getElementById('vhsGrid');
    grid.innerHTML = '';
    
    if (vhsData.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <h3>No hay VHS registrados</h3>
                <p>Comienza agregando tu primer VHS familiar</p>
            </div>
        `;
        return;
    }
    
    vhsData.forEach(vhs => {
        const card = createVHSCard(vhs);
        grid.appendChild(card);
    });
    
    // Mantener el modo de vista seleccionado
    const currentViewMode = document.getElementById('viewMode').value;
    if (currentViewMode) {
        applyViewMode(currentViewMode);
    }
    
    // Si es vista cascada, configurar las tarjetas
    if (currentViewMode === 'cascade') {
        setupCascadeCards();
    }
}

// Crear tarjeta de VHS
function createVHSCard(vhs) {
    const card = document.createElement('div');
    card.className = 'vhs-card';
    card.onclick = () => openVHSDetail(vhs);
    
    card.innerHTML = `
        <div class="vhs-card-header">
            <div>
                <div class="vhs-title">
                    ${vhs.video_nombre}
                </div>
            </div>
            <div class="vhs-actions">
                ${vhs.youtube_link && vhs.youtube_link.trim() !== '' ? '<i class="fab fa-youtube youtube-icon" title="Tiene enlace de YouTube"></i>' : ''}
                <button class="btn btn-secondary btn-sm" onclick="editVHS(event, '${vhs.video_nombre}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteVHS(event, '${vhs.video_nombre}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="vhs-meta">
            <div class="meta-item">
                <div class="meta-label">Duración</div>
                <div class="meta-value">${vhs.video_duracion_total}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Formato</div>
                <div class="meta-value">${vhs.video_formato}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Inicio</div>
                <div class="meta-value">${formatDate(vhs.video_fecha_inicio)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Término</div>
                <div class="meta-value">${formatDate(vhs.video_fecha_termino)}</div>
            </div>
        </div>
        <div class="events-preview">
            <h4>Eventos (${vhs.eventos.length})</h4>
            <div class="events-list-preview">
                ${vhs.eventos.map(evento => `
                    <div class="event-item">
                        <div class="event-date">${formatDate(evento.evento_fecha)}</div>
                        <div class="event-content">${evento.evento_contenido}</div>
                        ${renderEventTags(evento)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return card;
}

// Crear tarjeta de resultado de búsqueda
function createSearchResultCard(vhs, searchTerm) {
    const card = document.createElement('div');
    card.className = 'vhs-card search-result-card';
    card.onclick = () => openVHSDetail(vhs);
    
    card.innerHTML = `
        <div class="vhs-card-header">
            <div>
                <div class="vhs-title">${vhs.video_nombre}</div>
                <div class="search-result-info">
                    <span class="search-badge">
                        <i class="fas fa-search"></i> Resultado de búsqueda
                    </span>
                </div>
            </div>
            <div class="vhs-actions">
                ${vhs.youtube_link && vhs.youtube_link.trim() !== '' ? '<i class="fab fa-youtube youtube-icon" title="Tiene enlace de YouTube"></i>' : ''}
                <button class="btn btn-secondary btn-sm" onclick="editVHS(event, '${vhs.video_nombre}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteVHS(event, '${vhs.video_nombre}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="vhs-meta">
            <div class="meta-item">
                <div class="meta-label">Duración</div>
                <div class="meta-value">${vhs.video_duracion_total}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Formato</div>
                <div class="meta-value">${vhs.video_formato}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Inicio</div>
                <div class="meta-value">${formatDate(vhs.video_fecha_inicio)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Término</div>
                <div class="meta-value">${formatDate(vhs.video_fecha_termino)}</div>
            </div>
        </div>
        <div class="events-preview">
            <h4>Eventos encontrados (${vhs.eventos.length})</h4>
            <div class="events-list-preview">
                ${vhs.eventos.map(evento => `
                    <div class="event-item search-highlight">
                        <div class="event-date highlight-date">${formatDate(evento.evento_fecha)}</div>
                        <div class="event-content">${highlightSearchTerm(evento.evento_contenido, searchTerm)}</div>
                        ${renderEventTags(evento)}
                        <div class="event-time highlight-time">
                            <span class="time-start">${formatTime(evento.evento_inicio)}</span>
                            <span class="time-separator">-</span>
                            <span class="time-end">${formatTime(evento.evento_termino)}</span>
                        </div>
                        ${vhs.youtube_link && vhs.youtube_link.trim() !== '' ? `
                            <a href="${createYouTubeTimestampedURL(vhs.youtube_link, evento.evento_inicio)}" 
                               target="_blank" 
                               class="event-youtube-link-mini" 
                               title="Ver en YouTube desde ${formatTime(evento.evento_inicio)}"
                               onclick="event.stopPropagation()">
                                <i class="fab fa-youtube"></i>
                            </a>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return card;
}

// Filtrar VHS
function filterVHS(searchTerm) {
    if (!searchTerm.trim()) {
        renderVHSGrid();
        return;
    }
    
    const searchResults = [];
    
    vhsData.forEach(vhs => {
        const matchingEvents = vhs.eventos.filter(evento => 
            evento.evento_contenido.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingEvents.length > 0) {
            // Crear una copia del VHS con solo los eventos que coinciden
            const filteredVHS = {
                ...vhs,
                eventos: matchingEvents,
                searchHighlight: true
            };
            searchResults.push(filteredVHS);
        }
    });
    
    renderSearchResults(searchResults, searchTerm);
}

// Renderizar resultados de búsqueda
function renderSearchResults(searchResults, searchTerm) {
    const grid = document.getElementById('vhsGrid');
    grid.innerHTML = '';
    
    if (searchResults.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }
    
    // Calcular estadísticas
    const totalDuration = calculateTotalDuration(searchResults);
    const totalEvents = searchResults.reduce((sum, vhs) => sum + vhs.eventos.length, 0);
    
    // Agregar encabezado de búsqueda
    const searchHeader = document.createElement('div');
    searchHeader.className = 'search-results-header';
    searchHeader.innerHTML = `
        <div class="search-header-content">
            <h3>Resultados de búsqueda para: "${searchTerm}"</h3>
            <button class="btn btn-secondary btn-sm" onclick="clearSearch()">
                <i class="fas fa-times"></i> Limpiar búsqueda
            </button>
        </div>
        <div class="filter-stats">
            <div class="stat-item">
                <i class="fas fa-video"></i>
                <span class="stat-label">VHS:</span>
                <span class="stat-value">${searchResults.length}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-calendar-alt"></i>
                <span class="stat-label">Eventos:</span>
                <span class="stat-value">${totalEvents}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-clock"></i>
                <span class="stat-label">Duración total:</span>
                <span class="stat-value">${formatMinutesToReadable(totalDuration)}</span>
            </div>
        </div>
    `;
    grid.appendChild(searchHeader);
    
    searchResults.forEach(vhs => {
        const card = createSearchResultCard(vhs, searchTerm);
        grid.appendChild(card);
    });
    
    // Mantener el modo de vista seleccionado en los resultados de búsqueda
    const currentViewMode = document.getElementById('viewMode').value;
    if (currentViewMode) {
        applyViewMode(currentViewMode);
    }
    
    // Si es vista cascada, configurar las tarjetas
    if (currentViewMode === 'cascade') {
        setupCascadeCards();
    }
}

// Limpiar búsqueda
function clearSearch() {
    document.getElementById('searchInput').value = '';
    renderVHSGrid();
}

// Función para renderizar el filtro de tags
function renderTagsFilter() {
    const tagsFilter = document.getElementById('tagsFilter');
    if (!tagsFilter) return;
    
    tagsFilter.innerHTML = '';
    
    if (tags.length === 0) {
        tagsFilter.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay tags disponibles</p>';
        return;
    }
    
    // Ordenar tags por código numérico, luego alfabéticamente
    const sortedTags = [...tags].sort((a, b) => {
        const aCode = parseInt(a.code) || 0;
        const bCode = parseInt(b.code) || 0;
        if (aCode !== bCode) return aCode - bCode;
        return a.name.localeCompare(b.name);
    });
    
    sortedTags.forEach(tag => {
        const filterTag = document.createElement('div');
        filterTag.className = 'filter-tag';
        filterTag.dataset.tagCode = tag.code;
        filterTag.onclick = () => toggleTagFilter(tag.code);
        
        filterTag.innerHTML = `
            <div class="filter-tag-circle" style="background-color: ${tag.color}"></div>
            <span class="filter-tag-name">${tag.name}</span>
        `;
        
        tagsFilter.appendChild(filterTag);
    });
}

// Función para alternar la selección de un tag en el filtro
function toggleTagFilter(tagCode) {
    const filterTag = document.querySelector(`[data-tag-code="${tagCode}"]`);
    if (!filterTag) return;
    
    filterTag.classList.toggle('selected');
    applyFilters();
}

// Función para limpiar el filtro de tags
function clearTagsFilter() {
    const selectedTags = document.querySelectorAll('.filter-tag.selected');
    selectedTags.forEach(tag => tag.classList.remove('selected'));
    applyFilters();
}

// Función para aplicar filtros (texto + tags)
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedTagCodes = Array.from(document.querySelectorAll('.filter-tag.selected'))
        .map(tag => tag.dataset.tagCode);
    
    if (!searchTerm.trim() && selectedTagCodes.length === 0) {
        renderVHSGrid();
        return;
    }
    
    const filteredResults = [];
    
    vhsData.forEach(vhs => {
        const matchingEvents = vhs.eventos.filter(evento => {
            // Filtro por texto
            const textMatch = !searchTerm.trim() || 
                evento.evento_contenido.toLowerCase().includes(searchTerm) ||
                vhs.video_nombre.toLowerCase().includes(searchTerm);
            
            // Filtro por tags
            const tagMatch = selectedTagCodes.length === 0 || 
                selectedTagCodes.some(tagCode => evento.tags && evento.tags.includes(tagCode));
            
            return textMatch && tagMatch;
        });
        
        if (matchingEvents.length > 0) {
            const filteredVHS = {
                ...vhs,
                eventos: matchingEvents,
                searchHighlight: true
            };
            filteredResults.push(filteredVHS);
        }
    });
    
    if (filteredResults.length === 0) {
        renderEmptySearchResults(searchTerm, selectedTagCodes);
    } else {
        renderFilteredResults(filteredResults, searchTerm, selectedTagCodes);
    }
}

// Función para calcular la duración total en minutos de los videos encontrados
function calculateTotalDuration(filteredResults) {
    let totalMinutes = 0;
    
    filteredResults.forEach(vhs => {
        // Calcular duración de cada evento en el VHS
        vhs.eventos.forEach(evento => {
            if (evento.evento_duracion && evento.evento_duracion !== 'N/A' && evento.evento_duracion.trim() !== '') {
                const durationInMinutes = convertDurationToMinutes(evento.evento_duracion);
                totalMinutes += durationInMinutes;
            }
        });
    });
    
    return totalMinutes;
}

// Función para convertir duración HH:MM:SS a minutos
function convertDurationToMinutes(duration) {
    if (!duration || duration === 'N/A' || duration.trim() === '') {
        return 0;
    }
    
    try {
        const parts = duration.split(':').map(part => parseInt(part) || 0);
        
        if (parts.length === 3) {
            // Formato HH:MM:SS
            return parts[0] * 60 + parts[1] + (parts[2] / 60);
        } else if (parts.length === 2) {
            // Formato MM:SS
            return parts[0] + (parts[1] / 60);
        } else if (parts.length === 1) {
            // Formato SS
            return parts[0] / 60;
        }
        
        return 0;
    } catch (error) {
        console.error('Error al convertir duración a minutos:', error);
        return 0;
    }
}

// Función para formatear minutos a formato legible
function formatMinutesToReadable(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m ${seconds}s`;
    } else if (remainingMinutes > 0) {
        return `${remainingMinutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Función para renderizar resultados filtrados
function renderFilteredResults(filteredResults, searchTerm, selectedTagCodes) {
    const grid = document.getElementById('vhsGrid');
    grid.innerHTML = '';
    
    // Calcular estadísticas
    const totalDuration = calculateTotalDuration(filteredResults);
    const totalEvents = filteredResults.reduce((sum, vhs) => sum + vhs.eventos.length, 0);
    
    // Crear encabezado de filtros aplicados
    const filterHeader = document.createElement('div');
    filterHeader.className = 'filter-results-header';
    
    let filterDescription = '';
    if (searchTerm.trim()) {
        filterDescription += `Búsqueda: "${searchTerm}"`;
    }
    if (selectedTagCodes.length > 0) {
        if (filterDescription) filterDescription += ' + ';
        const tagNames = selectedTagCodes.map(code => {
            const tag = tags.find(t => t.code === code);
            return tag.name;
        });
        filterDescription += `Tags: ${tagNames.join(', ')}`;
    }
    
    filterHeader.innerHTML = `
        <div class="filter-header-content">
            <h3>Resultados filtrados</h3>
            <div class="filter-description">${filterDescription}</div>
            <button class="btn btn-secondary btn-sm" onclick="clearAllFilters()">
                <i class="fas fa-times"></i> Limpiar filtros
            </button>
        </div>
        <div class="filter-stats">
            <div class="stat-item">
                <i class="fas fa-video"></i>
                <span class="stat-label">VHS:</span>
                <span class="stat-value">${filteredResults.length}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-calendar-alt"></i>
                <span class="stat-label">Eventos:</span>
                <span class="stat-value">${totalEvents}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-clock"></i>
                <span class="stat-label">Duración total:</span>
                <span class="stat-value">${formatMinutesToReadable(totalDuration)}</span>
            </div>
        </div>
    `;
    grid.appendChild(filterHeader);
    
    filteredResults.forEach(vhs => {
        const card = createSearchResultCard(vhs, searchTerm);
        grid.appendChild(card);
    });
    
    // Mantener el modo de vista seleccionado
    const currentViewMode = document.getElementById('viewMode').value;
    if (currentViewMode) {
        applyViewMode(currentViewMode);
    }
    
    if (currentViewMode === 'cascade') {
        setupCascadeCards();
    }
}

// Función para renderizar resultados vacíos
function renderEmptySearchResults(searchTerm, selectedTagCodes) {
    const grid = document.getElementById('vhsGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otros términos de búsqueda o tags</p>
            <button class="btn btn-secondary" onclick="clearAllFilters()">
                <i class="fas fa-times"></i> Limpiar filtros
            </button>
        </div>
    `;
}

// Función para limpiar todos los filtros
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    clearTagsFilter();
    renderVHSGrid();
}

// Abrir modal de agregar VHS
function openAddVHSModal() {
    isEditingVHS = false;
    currentVHS = null;
    
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo VHS';
    document.getElementById('vhsForm').reset();
    
    // Actualizar el select de tags
    updateEventTagsSelect();
    
    document.getElementById('vhsModal').style.display = 'block';
}

// Abrir modal de editar VHS
function editVHS(event, videoNombre) {
    event.stopPropagation();
    
    isEditingVHS = true;
    currentVHS = vhsData.find(vhs => vhs.video_nombre === videoNombre);
    
    if (currentVHS) {
        document.getElementById('modalTitle').textContent = 'Editar VHS';
        document.getElementById('videoNombre').value = currentVHS.video_nombre;
        document.getElementById('videoDuracionTotal').value = currentVHS.video_duracion_total;
        document.getElementById('videoFormato').value = currentVHS.video_formato;
        document.getElementById('videoFechaInicio').value = formatDateForInput(currentVHS.video_fecha_inicio);
        document.getElementById('videoFechaTermino').value = formatDateForInput(currentVHS.video_fecha_termino);
        document.getElementById('videoVelocidad').value = currentVHS.video_velocidad;
        document.getElementById('youtubeLink').value = currentVHS.youtube_link || '';
        
        document.getElementById('vhsModal').style.display = 'block';
    }
}

// Manejar envío del formulario de VHS
function handleVHSSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newVHSData = {
        video_nombre: formData.get('videoNombre'),
        video_duracion_total: formData.get('videoDuracionTotal'),
        video_fecha_inicio: formatDateToDDMMYYYY(formData.get('videoFechaInicio')),
        video_fecha_termino: formatDateToDDMMYYYY(formData.get('videoFechaTermino')),
        video_formato: formData.get('videoFormato'),
        video_velocidad: formData.get('videoVelocidad'),
        youtube_link: formData.get('youtubeLink'),
        eventos: []
    };
    
    if (isEditingVHS && currentVHS) {
        // Editar VHS existente
        const index = vhsData.findIndex(vhs => vhs.video_nombre === currentVHS.video_nombre);
        if (index !== -1) {
            // Preservar los eventos existentes
            newVHSData.eventos = currentVHS.eventos;
            vhsData[index] = newVHSData;
            console.log('VHS editado:', newVHSData);
        }
    } else {
        // Agregar nuevo VHS
        vhsData.push(newVHSData);
        console.log('Nuevo VHS agregado:', newVHSData);
    }
    
    console.log('Estado actual de vhsData:', vhsData);
    
    closeVHSModal();
    renderVHSGrid();
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Mostrar mensaje de confirmación
    if (isEditingVHS) {
        alert('VHS actualizado exitosamente.');
    } else {
        alert('VHS agregado exitosamente.');
    }
}

// Abrir detalle del VHS
function openVHSDetail(vhs) {
    currentVHS = vhs;
    
    document.getElementById('detailVHSName').textContent = vhs.video_nombre;
    document.getElementById('detailVHSDuration').textContent = vhs.video_duracion_total;
    document.getElementById('detailVHSFormat').textContent = vhs.video_formato;
    document.getElementById('detailVHSPeriod').textContent = `${formatDate(vhs.video_fecha_inicio)} - ${formatDate(vhs.video_fecha_termino)}`;
    document.getElementById('detailVHSSpeed').textContent = vhs.video_velocidad;
    
    renderEventsList(vhs.eventos);
    document.getElementById('detailModal').style.display = 'block';
}

// Renderizar lista de eventos
function renderEventsList(eventos) {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    
    if (eventos.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <h3>No hay eventos registrados</h3>
                <p>Agrega eventos para organizar el contenido del VHS</p>
            </div>
        `;
        return;
    }
    
    eventos.forEach((evento, index) => {
        const eventElement = createEventElement(evento, index);
        eventsList.appendChild(eventElement);
    });
}

// Crear elemento de evento
function createEventElement(evento, index) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-detail';
    
    // Crear enlace de YouTube para el evento si existe
    let youtubeLink = '';
    if (currentVHS && currentVHS.youtube_link && currentVHS.youtube_link.trim() !== '') {
        const startTime = evento.evento_inicio || '00:00:00';
        const youtubeUrl = createYouTubeTimestampedURL(currentVHS.youtube_link, startTime);
        youtubeLink = `
            <a href="${youtubeUrl}" target="_blank" class="event-youtube-link" title="Ver en YouTube desde ${startTime}">
                <i class="fab fa-youtube"></i>
            </a>
        `;
    }
    
    eventElement.innerHTML = `
        <div class="event-detail-compact">
            <div class="event-detail-header-compact">
                <div class="event-detail-times-compact">
                    <div class="time-item-compact">
                        <span class="time-label-compact">Fecha:</span>
                        <span class="time-value-compact">${formatDate(evento.evento_fecha)}</span>
                    </div>
                    <div class="time-item-compact">
                        <span class="time-label-compact">Inicio:</span>
                        <span class="time-value-compact">${formatTime(evento.evento_inicio)}</span>
                    </div>
                    <div class="time-item-compact">
                        <span class="time-label-compact">Término:</span>
                        <span class="time-value-compact">${formatTime(evento.evento_termino)}</span>
                    </div>
                    <div class="time-item-compact">
                        <span class="time-label-compact">Duración:</span>
                        <span class="time-value-compact">${formatTime(evento.evento_duracion)}</span>
                    </div>
                </div>
                <div class="event-detail-actions-compact">
                    <button class="btn btn-secondary btn-sm event-edit-btn" onclick="editEvent(${index})" style="display: none;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm event-delete-btn" onclick="deleteEvent(${index})" style="display: none;">
                        <i class="fab fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="event-detail-content-compact">
                <div class="event-content-text">${evento.evento_contenido}</div>
                <div class="event-content-actions">
                    ${youtubeLink}
                    ${renderEventTags(evento)}
                </div>
            </div>
        </div>
    `;
    
    return eventElement;
}

// Abrir modal de agregar evento
function openAddEventModal() {
    isEditingEvent = false;
    currentEvent = null;
    
    // Cerrar el modal de detalles del VHS antes de abrir el de agregar evento
    closeDetailModal();
    
    document.getElementById('eventModalTitle').textContent = 'Agregar Evento';
    document.getElementById('eventForm').reset();
    
    // Actualizar la selección de tags y limpiar selecciones
    updateEventTagsSelect();
    
    // Limpiar selecciones previas
    setSelectedTags([]);
    
    document.getElementById('eventModal').style.display = 'block';
}

// Editar evento
function editEvent(index) {
    isEditingEvent = true;
    
    // Si estamos en modo de búsqueda, necesitamos encontrar el VHS original primero
    if (currentVHS.searchHighlight) {
        // Buscar el VHS original en vhsData
        const originalVHS = vhsData.find(vhs => vhs.video_nombre === currentVHS.video_nombre);
        if (originalVHS) {
            // Encontrar el evento correspondiente en el VHS original
            const originalEventIndex = originalVHS.eventos.findIndex(evento => 
                evento.evento_fecha === currentVHS.eventos[index].evento_fecha && 
                evento.evento_contenido === currentVHS.eventos[index].evento_contenido
            );
            
            if (originalEventIndex !== -1) {
                currentVHS = originalVHS; // Usar el VHS original, no la copia filtrada
                currentEvent = { ...currentVHS.eventos[originalEventIndex], index: originalEventIndex };
                console.log('Evento encontrado en VHS original, índice:', originalEventIndex);
            } else {
                console.warn('No se pudo encontrar el evento en el VHS original');
                currentEvent = { ...currentVHS.eventos[index], index };
            }
        } else {
            currentEvent = { ...currentVHS.eventos[index], index };
        }
    } else {
        currentEvent = { ...currentVHS.eventos[index], index };
    }
    
    // Cerrar el modal de detalles del VHS antes de abrir el de edición
    closeDetailModal();
    
    document.getElementById('eventModalTitle').textContent = 'Editar Evento';
    
    // Debug: verificar la fecha del evento
    console.log('=== DEBUG EDITAR EVENTO ===');
    console.log('currentEvent:', currentEvent);
    console.log('currentEvent.evento_fecha:', currentEvent.evento_fecha);
    console.log('Tipo de evento_fecha:', typeof currentEvent.evento_fecha);
    
    // Convertir fecha DD/MM/YYYY a YYYY-MM-DD para el input de tipo date
    let fechaParaInput = '';
    if (currentEvent.evento_fecha && currentEvent.evento_fecha.trim() !== '') {
        // Si la fecha está en formato DD/MM/YYYY, convertirla a YYYY-MM-DD
        if (currentEvent.evento_fecha.includes('/')) {
            const partes = currentEvent.evento_fecha.split('/');
            if (partes.length === 3) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const año = partes[2];
                fechaParaInput = `${año}-${mes}-${dia}`;
            }
        } else {
            // Si ya está en formato YYYY-MM-DD, usarla directamente
            fechaParaInput = currentEvent.evento_fecha;
        }
    }
    
    document.getElementById('eventoFecha').value = fechaParaInput;
    document.getElementById('eventoContenido').value = currentEvent.evento_contenido;
    document.getElementById('eventoInicio').value = currentEvent.evento_inicio;
    document.getElementById('eventoTermino').value = currentEvent.evento_termino;
    document.getElementById('eventoDuracion').value = currentEvent.evento_duracion;
    
    // Cargar tags seleccionados
    const tagsContainer = document.querySelector('.tags-selection');
    if (tagsContainer && currentEvent.tags) {
        setSelectedTags(currentEvent.tags);
    }
    
    document.getElementById('eventModal').style.display = 'block';
}

// Manejar envío del formulario de evento
function handleEventSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    // Obtener tags seleccionados desde los checkboxes
    const selectedTags = getSelectedTags();
    
    // Log para debugging
    console.log('Tags seleccionados:', selectedTags);
    
    // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY para almacenamiento
    let eventoFecha = '';
    const fechaInput = formData.get('eventoFecha');
    if (fechaInput && fechaInput.trim() !== '') {
        // Si la fecha está en formato YYYY-MM-DD, convertirla a DD/MM/YYYY
        if (fechaInput.includes('-')) {
            const partes = fechaInput.split('-');
            if (partes.length === 3) {
                const año = partes[0];
                const mes = partes[1];
                const dia = partes[2];
                eventoFecha = `${dia}/${mes}/${año}`;
            }
        } else {
            // Si ya está en formato DD/MM/YYYY, usarla directamente
            eventoFecha = fechaInput;
        }
    }
    
    const eventData = {
        evento_fecha: eventoFecha,
        evento_contenido: formData.get('eventoContenido'),
        evento_inicio: formData.get('eventoInicio'),
        evento_termino: formData.get('eventoTermino'),
        evento_duracion: formData.get('eventoDuracion'),
        tags: selectedTags
    };
    
    if (isEditingEvent && currentEvent !== null) {
        // Editar evento existente
        const oldEvent = currentVHS.eventos[currentEvent.index];
        
        console.log('=== EDITANDO EVENTO ===');
        console.log('Evento anterior:', oldEvent);
        console.log('Nuevos datos:', eventData);
        
        // Preservar la fecha original si el campo está vacío
        if (!eventData.evento_fecha || eventData.evento_fecha.trim() === '') {
            eventData.evento_fecha = oldEvent.evento_fecha;
        }
        
        currentVHS.eventos[currentEvent.index] = eventData;
        
        // Siempre actualizar la duración del evento editado
        const nuevaDuracion = calculateDuration(eventData.evento_inicio, eventData.evento_termino);
        eventData.evento_duracion = nuevaDuracion;
        console.log('Duración calculada:', nuevaDuracion);
        
        // Actualizar inicio del siguiente evento si existe
        updateNextEventStartTime(currentVHS.eventos, currentEvent.index, eventData.evento_termino);
        
    } else {
        // Agregar nuevo evento
        console.log('=== AGREGANDO NUEVO EVENTO ===');
        console.log('Datos del evento:', eventData);
        
        currentVHS.eventos.push(eventData);
        
        // Calcular duración automáticamente
        const nuevaDuracion = calculateDuration(eventData.evento_inicio, eventData.evento_termino);
        eventData.evento_duracion = nuevaDuracion;
        console.log('Duración calculada:', nuevaDuracion);
        
        // Actualizar inicio del siguiente evento si existe
        updateNextEventStartTime(currentVHS.eventos, currentVHS.eventos.length - 1, eventData.evento_termino);
    }
    
    closeEventModal();
    
    // Si estamos en modo de búsqueda, actualizar también la vista de búsqueda
    if (document.getElementById('searchInput').value.trim() !== '') {
        // Aplicar filtros para actualizar la vista de búsqueda
        applyFilters();
    } else {
        // Actualizar la vista normal
        renderEventsList(currentVHS.eventos);
        renderVHSGrid();
    }
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Mostrar mensaje de confirmación solo para eventos nuevos
    if (!isEditingEvent) {
        alert('Evento agregado exitosamente.');
    }
}

// Eliminar VHS
function deleteVHS(event, videoNombre) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de que quieres eliminar el VHS "${videoNombre}"?`)) {
        const index = vhsData.findIndex(vhs => vhs.video_nombre === videoNombre);
        if (index !== -1) {
            vhsData.splice(index, 1);
            renderVHSGrid();
            
                    // Guardar en localStorage
        saveToLocalStorage();
        
        alert('VHS eliminado exitosamente.');
        }
    }
}

// Eliminar evento
function deleteEvent(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        currentVHS.eventos.splice(index, 1);
        renderEventsList(currentVHS.eventos);
        renderVHSGrid();
        
        // Guardar en localStorage
        saveToLocalStorage();
        
        alert('Evento eliminado exitosamente.');
    }
}

// Cerrar modales
function closeVHSModal() {
    document.getElementById('vhsModal').style.display = 'none';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    
    // Si hay un VHS actual y se está editando un evento, abrir el modal de detalles
    if (currentVHS && isEditingEvent) {
        // Pequeño delay para asegurar que el modal se cierre completamente
        setTimeout(() => {
            openVHSDetail(currentVHS);
        }, 100);
    }
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

function openInfoModal() {
    document.getElementById('infoModal').style.display = 'block';
}

function closeAllModals() {
    closeVHSModal();
    closeEventModal();
    closeDetailModal();
    closeTagsModal();
    closeCreateTagModal();
    closeEditTagModal();
    closeInfoModal();
}

// Utilidades
function formatDate(dateString) {
    if (!dateString || dateString === 'nan' || dateString === '00/00/00' || dateString.trim() === '') {
        return 'N/A';
    }
    
    try {
        // Si la fecha ya está en formato DD/MM/AAAA, mantenerla así
        if (dateString.includes('/') && dateString.split('/').length === 3) {
            const parts = dateString.split('/');
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            
            // Validar que sea una fecha válida
            if (day && month && year && day !== '00' && month !== '00' && year !== '0000') {
                return dateString; // Mantener formato DD/MM/AAAA
            }
        }
        
        // Si no es formato DD/MM/AAAA válido, intentar convertir
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('es-ES');
        }
        
        return dateString;
    } catch (e) {
        return dateString;
    }
}

function formatDateForInput(dateString) {
    if (!dateString || dateString === 'nan' || dateString === '00/00/00' || dateString.trim() === '') {
        return '';
    }
    
    try {
        // Si la fecha ya está en formato DD/MM/AAAA, convertirla a formato ISO para el input
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parts[0];
                const month = parts[1];
                const year = parts[2];
                
                // Crear fecha en formato MM/DD/AAAA (formato que JavaScript entiende)
                const date = new Date(`${month}/${day}/${year}`);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
        
        // Si no es formato DD/MM/AAAA, intentar con Date() normal
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        return '';
    } catch (e) {
        return '';
    }
}

// Función para formatear horas y manejar campos vacíos
function formatTime(timeString) {
    if (!timeString || timeString === 'nan' || timeString === '00:00:00' || timeString.trim() === '') {
        return 'N/A';
    }
    return timeString;
}

// Función para convertir fecha de formato ISO a DD/MM/AAAA
function formatDateToDDMMYYYY(dateString) {
    if (!dateString || dateString.trim() === '') {
        return '';
    }
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

// Función para resaltar el término de búsqueda
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight-text">$1</mark>');
}

// Función para crear URL de YouTube con timestamp
function createYouTubeTimestampedURL(youtubeURL, startTime) {
    try {
        // Convertir tiempo a segundos
        const timeInSeconds = convertTimeToSeconds(startTime);
        
        // Extraer ID del video de YouTube
        let videoId = '';
        
        // Patrones comunes de URLs de YouTube
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = youtubeURL.match(pattern);
            if (match) {
                videoId = match[1];
                break;
            }
        }
        
        if (!videoId) {
            console.warn('No se pudo extraer el ID del video de YouTube:', youtubeURL);
            return youtubeURL; // Devolver URL original si no se puede procesar
        }
        
        // Crear URL con timestamp
        return `https://www.youtube.com/watch?v=${videoId}&t=${timeInSeconds}`;
        
    } catch (error) {
        console.error('Error al crear URL con timestamp:', error);
        return youtubeURL; // Devolver URL original en caso de error
    }
}

// Función para calcular duración entre dos tiempos
function calculateDuration(startTime, endTime) {
    console.log('Calculando duración entre:', startTime, 'y', endTime);
    
    if (!startTime || !endTime || startTime === 'N/A' || endTime === 'N/A' || 
        startTime.trim() === '' || endTime.trim() === '') {
        console.log('Tiempos inválidos, retornando 00:00:00');
        return '00:00:00';
    }
    
    try {
        const startSeconds = convertTimeToSeconds(startTime);
        const endSeconds = convertTimeToSeconds(endTime);
        
        console.log('Segundos - Inicio:', startSeconds, 'Fin:', endSeconds);
        
        if (startSeconds === 0 || endSeconds === 0) {
            console.log('Uno de los tiempos es 0, retornando 00:00:00');
            return '00:00:00';
        }
        
        let durationSeconds = endSeconds - startSeconds;
        console.log('Duración en segundos:', durationSeconds);
        
        // Si la duración es negativa, asumir que es del día siguiente
        if (durationSeconds < 0) {
            durationSeconds += 24 * 3600; // Agregar 24 horas
            console.log('Duración negativa, ajustando a:', durationSeconds);
        }
        
        const result = convertSecondsToTime(durationSeconds);
        console.log('Duración final calculada:', result);
        return result;
        
    } catch (error) {
        console.error('Error al calcular duración:', error);
        return '00:00:00';
    }
}

// Función para convertir segundos a formato HH:MM:SS
function convertSecondsToTime(seconds) {
    if (seconds < 0) seconds = 0;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Función para convertir tiempo HH:MM:SS a segundos
function convertTimeToSeconds(timeString) {
    if (!timeString || timeString === 'N/A' || timeString.trim() === '') {
        return 0;
    }
    
    try {
        const parts = timeString.split(':').map(part => parseInt(part) || 0);
        
        if (parts.length === 3) {
            // Formato HH:MM:SS
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            // Formato MM:SS
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
            // Formato SS
            return parts[0];
        }
        
        return 0;
    } catch (error) {
        console.error('Error al convertir tiempo a segundos:', error);
        return 0;
    }
}

// Función para actualizar el tiempo de inicio del siguiente evento
function updateNextEventStartTime(eventos, currentEventIndex, newEndTime) {
    console.log('=== ACTUALIZANDO SIGUIENTE EVENTO ===');
    console.log('Índice del evento actual:', currentEventIndex);
    console.log('Nuevo tiempo de término:', newEndTime);
    console.log('Total de eventos:', eventos.length);
    
    // Buscar el siguiente evento en la lista
    const nextEventIndex = currentEventIndex + 1;
    
    if (nextEventIndex < eventos.length) {
        const nextEvent = eventos[nextEventIndex];
        console.log('Siguiente evento encontrado:', nextEvent);
        
        const currentInicio = nextEvent.evento_inicio;
        const currentInicioSeconds = convertTimeToSeconds(currentInicio);
        const newEndSeconds = convertTimeToSeconds(newEndTime);
        
        console.log('Tiempo de inicio actual:', currentInicio, '(', currentInicioSeconds, 'segundos)');
        console.log('Nuevo tiempo de término:', newEndTime, '(', newEndSeconds, 'segundos)');
        
        // Siempre actualizar el tiempo de inicio del siguiente evento cuando se edita el evento actual
        console.log('Actualizando tiempo de inicio del siguiente evento...');
        nextEvent.evento_inicio = newEndTime;
        
        // Recalcular la duración del siguiente evento si tiene tiempo de término
        if (nextEvent.evento_termino && nextEvent.evento_termino !== 'N/A' && nextEvent.evento_termino.trim() !== '') {
            console.log('Recalculando duración del siguiente evento...');
            const nuevaDuracion = calculateDuration(nextEvent.evento_inicio, nextEvent.evento_termino);
            nextEvent.evento_duracion = nuevaDuracion;
            console.log('Nueva duración del siguiente evento:', nuevaDuracion);
        } else {
            console.log('El siguiente evento no tiene tiempo de término, no se recalcula duración');
        }
        
        console.log(`✅ Tiempo de inicio del siguiente evento actualizado a: ${newEndTime}`);
    } else {
        console.log('❌ No hay siguiente evento para actualizar');
    }
}

// Almacenamiento local
function saveToLocalStorage() {
    try {
        localStorage.setItem('vhsData', JSON.stringify(vhsData));
        console.log('Datos guardados en localStorage:', vhsData);
        
        // NO crear respaldo automático aquí para evitar duplicados
        // El respaldo se creará en las funciones específicas
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        alert('Error al guardar los datos. Verifica que el navegador tenga localStorage habilitado.');
    }
}

// Función para crear archivo de respaldo
function createBackupFile() {
    try {
        // Obtener nombre del archivo original si existe
        let originalFileName = 'vhs_familiares';
        
        // Intentar obtener el nombre del archivo desde localStorage
        const savedFileName = localStorage.getItem('currentFileName');
        if (savedFileName) {
            originalFileName = savedFileName;
        } else {
            // Intentar obtener el nombre del archivo CSV cargado
            const csvFileInput = document.getElementById('csvFileInput');
            if (csvFileInput.files.length > 0) {
                const fileName = csvFileInput.files[0].name;
                originalFileName = fileName.replace('.csv', '').replace('.txt', '');
            }
        }
        
        // Crear nombre del archivo de respaldo (siempre el mismo)
        const backupFileName = `${originalFileName}_bkp.csv`;
        
        // Generar contenido CSV con columna de YouTube
        let csvContent = 'Nombre_de_la_cinta,Fecha_inicio_grabacion,Fecha_termino_grabacion,Duracion_total_cinta,Formato_cinta,Velocidad_cinta,YouTube_Link,Fecha_contenido,Contenido,Inicio,Termino,Duracion_segmento,Tags\n';
        
        vhsData.forEach(vhs => {
            if (vhs.eventos.length === 0) {
                // VHS sin eventos
                csvContent += `${vhs.video_nombre || ''},${vhs.video_fecha_inicio || ''},${vhs.video_fecha_termino || ''},${vhs.video_duracion_total || ''},${vhs.video_formato || ''},${vhs.video_velocidad || ''},${vhs.youtube_link || ''},,,,,\n`;
            } else {
                // VHS con eventos
                vhs.eventos.forEach(evento => {
                                    // Exportar códigos de tags en lugar de nombres para el respaldo
                // Filtrar tags vacíos y unir con comas
                const cleanTagCodes = evento.tags.filter(tag => tag && tag.trim() !== '');
                csvContent += `${vhs.video_nombre || ''},${vhs.video_fecha_inicio || ''},${vhs.video_fecha_termino || ''},${vhs.video_duracion_total || ''},${vhs.video_formato || ''},${vhs.video_velocidad || ''},${vhs.youtube_link || ''},${evento.evento_fecha || ''},${evento.evento_contenido || ''},${evento.evento_inicio || ''},${evento.evento_termino || ''},${evento.evento_duracion || ''},${cleanTagCodes.join('|')}\n`;
                });
            }
        });
        
        // Crear y descargar archivo de respaldo (reemplaza el anterior)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', backupFileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar la URL del blob para liberar memoria
        URL.revokeObjectURL(url);
        
        // Verificar si ya existe un archivo con el mismo nombre y eliminarlo
        // Esto asegura que solo haya un archivo de respaldo
        console.log(`Respaldo único creado: ${backupFileName}`);
        
        // Mostrar notificación de respaldo actualizado
        showBackupNotification(backupFileName, true);
        
        console.log(`Respaldo actualizado: ${backupFileName}`);
    } catch (error) {
        console.error('Error al crear archivo de respaldo:', error);
        // No mostrar error al usuario para no interrumpir la experiencia
    }
}

// Función para mostrar notificación de respaldo
function showBackupNotification(fileName, isUpdate = false) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'backup-notification';
    
    if (isUpdate) {
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>Respaldo actualizado: <strong>${fileName}</strong></span>
        `;
    } else {
        notification.innerHTML = `
            <i class="fas fa-save"></i>
            <span>Respaldo automático creado: <strong>${fileName}</strong></span>
        `;
    }
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar después de 4 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('vhsData');
        if (saved) {
            vhsData = JSON.parse(saved);
            renderVHSGrid();
            console.log('Datos cargados desde localStorage:', vhsData);
        }
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
        // Si hay error, cargar datos de ejemplo
        loadSampleData();
    }
}

// Función para manejar la importación del CSV
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (file) {
        importCSVFile(file);
    }
    // Limpiar el input para permitir importar el mismo archivo nuevamente
    event.target.value = '';
}

// Función para importar archivo CSV
function importCSVFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        parseCSVData(csvData);
        renderVHSGrid();
        
        // Guardar el nombre del archivo para futuros respaldos
        const fileName = file.name.replace('.csv', '').replace('.txt', '');
        localStorage.setItem('currentFileName', fileName);
        
        saveToLocalStorage();
        alert('Archivo CSV importado exitosamente');
    };
    reader.readAsText(file);
}


// Función para cambiar el modo de vista
function changeViewMode() {
    const viewMode = document.getElementById('viewMode').value;
    localStorage.setItem('viewMode', viewMode);
    applyViewMode(viewMode);
}

// Función para aplicar el modo de vista
function applyViewMode(viewMode) {
    const grid = document.getElementById('vhsGrid');
    
    // Remover todas las clases de vista anteriores
    grid.classList.remove('grid', 'cascade', 'three-columns', 'masonry');
    
    // Agregar la nueva clase de vista
    grid.classList.add(viewMode);
    
    // Aplicar estilos específicos según la vista
    switch(viewMode) {
        case 'cascade':
            grid.style.display = 'flex';
            grid.style.flexDirection = 'column';
            // Configurar tarjetas colapsadas por defecto
            setupCascadeCards();
            break;
        case 'three-columns':
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            break;
        case 'masonry':
            grid.style.display = 'block';
            grid.style.columnCount = '3';
            grid.style.columnGap = '20px';
            break;
        default: // grid
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
            break;
    }
}

// Función para configurar tarjetas en vista cascada
function setupCascadeCards() {
    const cards = document.querySelectorAll('.vhs-grid.cascade .vhs-card');
    cards.forEach(card => {
        // Agregar clase colapsada por defecto
        card.classList.remove('expanded');
        
        // Agregar evento de clic para expandir/colapsar
        card.addEventListener('click', function(e) {
            // No expandir si se hace clic en botones de acción
            if (e.target.closest('.vhs-actions')) {
                return;
            }
            
            // Alternar estado expandido/colapsado
            if (this.classList.contains('expanded')) {
                this.classList.remove('expanded');
            } else {
                // Colapsar todas las demás tarjetas
                cards.forEach(c => c.classList.remove('expanded'));
                // Expandir esta tarjeta
                this.classList.add('expanded');
            }
        });
    });
}

// Cargar datos guardados al iniciar
loadFromLocalStorage();

// ===== FUNCIONES PARA GESTIONAR TAGS =====

// Cargar tags desde localStorage
function loadTagsFromLocalStorage() {
    try {
        const savedTags = localStorage.getItem('vhsTags');
        const savedNextTagId = localStorage.getItem('nextTagId');
        
        if (savedTags) {
            tags = JSON.parse(savedTags);
        }
        
        if (savedNextTagId) {
            nextTagId = parseInt(savedNextTagId);
        }
        
        // Si no hay tags, crear algunos por defecto
        if (tags.length === 0) {
            createDefaultTags();
        }
        
        console.log('Tags cargados:', tags);
    } catch (error) {
        console.error('Error al cargar tags:', error);
        createDefaultTags();
    }
}

// Crear tags por defecto
function createDefaultTags() {
    const defaultTags = [
        { id: 1, name: 'Familia', color: '#667eea', code: '1' },
        { id: 2, name: 'Evento', color: '#48bb78', code: '2' },
        { id: 3, name: 'Persona', color: '#ed8936', code: '3' },
        { id: 4, name: 'Lugar', color: '#9f7aea', code: '4' },
        { id: 5, name: 'Fecha', color: '#f56565', code: '5' }
    ];
    
    tags = defaultTags;
    nextTagId = 6;
    saveTagsToLocalStorage();
}

// Guardar tags en localStorage
function saveTagsToLocalStorage() {
    try {
        localStorage.setItem('vhsTags', JSON.stringify(tags));
        localStorage.setItem('nextTagId', nextTagId.toString());
        console.log('Tags guardados en localStorage:', tags);
    } catch (error) {
        console.error('Error al guardar tags:', error);
    }
}

// Abrir modal de gestión de tags
function openTagsManager() {
    renderTagsList();
    document.getElementById('tagsModal').style.display = 'block';
}

// Cerrar modal de gestión de tags
function closeTagsModal() {
    document.getElementById('tagsModal').style.display = 'none';
}

// Renderizar lista de tags
function renderTagsList() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = '';
    
    if (tags.length === 0) {
        tagsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags"></i>
                <h3>No hay tags creados</h3>
                <p>Crea tu primer tag personalizado</p>
            </div>
        `;
        return;
    }
    
    tags.forEach(tag => {
        const tagElement = createTagElement(tag);
        tagsList.appendChild(tagElement);
    });
}

// Crear elemento de tag para la lista
function createTagElement(tag) {
    const tagElement = document.createElement('div');
    tagElement.className = 'tag-item';
    
    tagElement.innerHTML = `
        <div class="tag-info">
            <div class="tag-color" style="background-color: ${tag.color}"></div>
            <div class="tag-name">${tag.name}</div>
            <div class="tag-code">${tag.code}</div>
        </div>
        <div class="tag-actions">
            <button class="btn btn-secondary btn-sm" onclick="editTag(${tag.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteTag(${tag.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return tagElement;
}

// Crear nuevo tag
function createTag(tagData) {
    const newTag = {
        id: nextTagId++,
        name: tagData.name,
        color: tagData.color,
        code: generateTagCode()
    };
    
    tags.push(newTag);
    saveTagsToLocalStorage();
    renderTagsList();
    
    // Actualizar el select de tags en el modal de eventos
    updateEventTagsSelect();
    
    // Actualizar el filtro de tags
    renderTagsFilter();
    
    console.log('Nuevo tag creado:', newTag);
    return newTag;
}

// Generar código único para tag
function generateTagCode() {
    // Buscar el siguiente número disponible del 1 al 100
    const usedCodes = tags.map(tag => parseInt(tag.code));
    let nextCode = 1;
    
    while (usedCodes.includes(nextCode) && nextCode <= 100) {
        nextCode++;
    }
    
    if (nextCode > 100) {
        // Si se agotaron los números del 1-100, usar un código alfanumérico
        const prefix = 'TAG';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }
    
    return nextCode.toString();
}

// Editar tag
function editTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    // Guardar el tag actual para la edición
    currentEditingTag = tag;
    
    // Llenar el formulario con los valores actuales
    document.getElementById('editTagName').value = tag.name;
    document.getElementById('editTagColor').value = tag.color;
    
    // Abrir el modal de edición
    document.getElementById('editTagModal').style.display = 'block';
}

// Función para abrir el modal de crear tag
function openCreateTagModal() {
    document.getElementById('createTagModal').style.display = 'block';
}

// Función para alternar el modo de edición de eventos
function toggleEventEditMode() {
    const editButtons = document.querySelectorAll('.event-edit-btn');
    const deleteButtons = document.querySelectorAll('.event-delete-btn');
    const toggleButton = document.querySelector('.events-actions .btn-secondary');
    
    // Verificar si los botones están visibles
    const isVisible = editButtons[0] && editButtons[0].style.display !== 'none';
    
    if (isVisible) {
        // Ocultar botones de edición
        editButtons.forEach(btn => btn.style.display = 'none');
        deleteButtons.forEach(btn => btn.style.display = 'none');
        toggleButton.innerHTML = '<i class="fas fa-edit"></i> Editar Eventos';
        toggleButton.classList.remove('btn-success');
        toggleButton.classList.add('btn-secondary');
    } else {
        // Mostrar botones de edición
        editButtons.forEach(btn => btn.style.display = 'inline-flex');
        deleteButtons.forEach(btn => btn.style.display = 'inline-flex');
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Edición';
        toggleButton.classList.remove('btn-secondary');
        toggleButton.classList.add('btn-success');
    }
}

// Función para cerrar el modal de crear tag
function closeCreateTagModal() {
    document.getElementById('createTagModal').style.display = 'none';
    document.getElementById('createTagForm').reset();
    // Restaurar color por defecto
    document.getElementById('createTagColor').value = '#667eea';
}

// Función para manejar el envío del formulario de crear tag
function handleCreateTagSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const tagData = {
        name: formData.get('createTagName').trim(),
        color: formData.get('createTagColor')
    };
    
    if (tagData.name && tagData.name !== '') {
        createTag(tagData);
        closeCreateTagModal();
        alert('Tag creado exitosamente.');
    }
}

// Función para cerrar el modal de edición de tags
function closeEditTagModal() {
    document.getElementById('editTagModal').style.display = 'none';
    currentEditingTag = null;
    document.getElementById('editTagForm').reset();
}

// Función para manejar el envío del formulario de edición de tags
function handleEditTagSubmit(event) {
    event.preventDefault();
    
    if (!currentEditingTag) return;
    
    const formData = new FormData(event.target);
    const newName = formData.get('editTagName').trim();
    const newColor = formData.get('editTagColor');
    
    if (newName && newName !== '') {
        // Actualizar el tag
        currentEditingTag.name = newName;
        currentEditingTag.color = newColor;
        
        // Guardar cambios
        saveTagsToLocalStorage();
        renderTagsList();
        updateEventTagsSelect();
        
        // Actualizar el filtro de tags
        renderTagsFilter();
        
        // Cerrar el modal
        closeEditTagModal();
        
        console.log('Tag editado:', currentEditingTag);
        alert('Tag actualizado exitosamente.');
    }
}

// Eliminar tag
function deleteTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar el tag "${tag.name}"?`)) {
        // Remover tag de todos los eventos que lo usen
        vhsData.forEach(vhs => {
            vhs.eventos.forEach(evento => {
                if (evento.tags && evento.tags.includes(tag.code)) {
                    evento.tags = evento.tags.filter(t => t !== tag.code);
                }
            });
        });
        
        // Remover tag de la lista
        tags = tags.filter(t => t.id !== tagId);
        saveTagsToLocalStorage();
        renderTagsList();
        updateEventTagsSelect();
        
        // Actualizar el filtro de tags
        renderTagsFilter();
        
        // Guardar cambios en VHS
        saveToLocalStorage();
        
        console.log('Tag eliminado:', tag);
        alert('Tag eliminado exitosamente.');
    }
}

// Exportar tags
function exportTags() {
    try {
        const tagsData = {
            tags: tags,
            nextTagId: nextTagId,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(tagsData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vhs_tags.json';
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Tags exportados:', tagsData);
    } catch (error) {
        console.error('Error al exportar tags:', error);
        alert('Error al exportar tags.');
    }
}

// Importar tags
function importTags(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const tagsData = JSON.parse(e.target.result);
            
            if (tagsData.tags && Array.isArray(tagsData.tags)) {
                tags = tagsData.tags;
                nextTagId = tagsData.nextTagId || (Math.max(...tags.map(t => t.id)) + 1);
                
                saveTagsToLocalStorage();
                renderTagsList();
                updateEventTagsSelect();
                
                alert(`Tags importados exitosamente. Se importaron ${tags.length} tags.`);
                console.log('Tags importados:', tags);
            } else {
                alert('Formato de archivo inválido.');
            }
        } catch (error) {
            console.error('Error al importar tags:', error);
            alert('Error al importar tags. Verifica que el archivo sea válido.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Limpiar input
}

// Actualizar selección de tags en modal de eventos
function updateEventTagsSelect() {
    const tagsContainer = document.querySelector('.tags-selection');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    // Ordenar tags por código numérico si es posible, sino alfabéticamente
    const sortedTags = [...tags].sort((a, b) => {
        const aCode = parseInt(a.code);
        const bCode = parseInt(b.code);
        
        // Si ambos son números, ordenar numéricamente
        if (!isNaN(aCode) && !isNaN(bCode)) {
            return aCode - bCode;
        }
        
        // Si solo uno es número, poner el número primero
        if (!isNaN(aCode) && isNaN(bCode)) return -1;
        if (isNaN(aCode) && !isNaN(bCode)) return 1;
        
        // Si ninguno es número, ordenar alfabéticamente por nombre
        return a.name.localeCompare(b.name);
    });
    
    sortedTags.forEach(tag => {
        const tagOption = document.createElement('div');
        tagOption.className = 'tag-option';
        tagOption.dataset.tagCode = tag.code;
        
        tagOption.innerHTML = `
            <div class="tag-label">
                <span class="tag-color-circle" style="background-color: ${tag.color}"></span>
                <span class="tag-name">${tag.name}</span>
                <span class="tag-code">${tag.code}</span>
            </div>
        `;
        
        // Agregar evento de clic para seleccionar/deseleccionar el tag
        tagOption.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
        
        tagsContainer.appendChild(tagOption);
    });
}

// Obtener tags seleccionados desde los botones
function getSelectedTags() {
    const selectedTags = [];
    const selectedOptions = document.querySelectorAll('.tag-option.selected');
    
    selectedOptions.forEach(option => {
        selectedTags.push(option.dataset.tagCode);
    });
    
    return selectedTags;
}

// Establecer tags seleccionados en los botones
function setSelectedTags(selectedTagCodes) {
    if (!selectedTagCodes || selectedTagCodes.length === 0) {
        // Desmarcar todos los tags
        document.querySelectorAll('.tag-option').forEach(option => {
            option.classList.remove('selected');
        });
        return;
    }
    
    // Marcar solo los tags seleccionados
    document.querySelectorAll('.tag-option').forEach(option => {
        if (selectedTagCodes.includes(option.dataset.tagCode)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Renderizar tags en eventos
function renderEventTags(evento) {
    if (!evento.tags || evento.tags.length === 0) {
        return '';
    }
    
    const tagsHtml = evento.tags.map(tagCode => {
        const tag = tags.find(t => t.code === tagCode);
        if (!tag) return '';
        
        return `
            <span class="event-tag" title="${tag.name} (${tag.code})">
                <span class="event-tag-circle" style="background-color: ${tag.color}"></span>
            </span>
        `;
    }).join('');
    
    return `<div class="event-tags">${tagsHtml}</div>`;
}

// Inicializar sistema de tags
function initializeTags() {
    loadTagsFromLocalStorage();
    updateEventTagsSelect();
    renderTagsFilter(); // Renderizar también el filtro de tags
}

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado exitosamente:', registration.scope);
            })
            .catch(function(error) {
                console.log('Error al registrar ServiceWorker:', error);
            });
    });
}
