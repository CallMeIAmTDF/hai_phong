// Map initialization
const map = L.map('map').setView([20.8449, 106.6881], 13); // Default Hai Phong

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let allData = [];
let markers = [];
let currentFilter = 'all';
let searchQuery = '';

// Load data
async function loadData() {
    try {
        const response = await fetch('data_with_coords.json');
        allData = await response.json();
        renderList(allData);
        renderMarkers(allData);
        fitMapBounds();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('restaurantList').innerHTML = 
            '<div class="no-results">Lỗi tải dữ liệu. Hãy đảm bảo bạn chạy ứng dụng trên một máy chủ cục bộ (local server).</div>';
    }
}

// Get color based on meal type
function getMealColor(mealType) {
    if (!mealType) return 'var(--color-default)';
    const type = mealType.toLowerCase();
    if (type.includes('sáng')) return 'var(--color-breakfast)';
    if (type.includes('trưa')) return 'var(--color-lunch)';
    if (type.includes('tối')) return 'var(--color-dinner)';
    if (type.includes('vặt')) return 'var(--color-snack)';
    return 'var(--color-main)';
}

function getMealIcon(mealType) {
    if (!mealType) return 'fa-utensils';
    const type = mealType.toLowerCase();
    if (type.includes('sáng')) return 'fa-mug-saucer';
    if (type.includes('trưa')) return 'fa-bowl-rice';
    if (type.includes('tối')) return 'fa-wine-glass';
    if (type.includes('vặt')) return 'fa-ice-cream';
    return 'fa-utensils';
}

// Render list of restaurants
function renderList(data) {
    const listContainer = document.getElementById('restaurantList');
    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = '<div class="no-results">Không tìm thấy kết quả nào phù hợp.</div>';
        return;
    }

    data.forEach((item, index) => {
        const address = Array.isArray(item.dia_chi) ? item.dia_chi.join(' | ') : item.dia_chi;
        const mealType = item.bua_an || 'Chưa phân loại';
        const color = getMealColor(mealType);
        
        const el = document.createElement('div');
        el.className = 'restaurant-item';
        el.dataset.index = index;
        
        el.innerHTML = `
            <h3>${item.ten_quan}</h3>
            <div class="item-detail">
                <i class="fa-solid fa-location-dot"></i>
                <span>${address}</span>
            </div>
            ${item.thoi_gian_mo ? `
            <div class="item-detail">
                <i class="fa-regular fa-clock"></i>
                <span>${item.thoi_gian_mo}</span>
            </div>
            ` : ''}
            <div class="meal-badge" style="background-color: ${color}">
                <i class="fa-solid ${getMealIcon(mealType)}"></i> ${mealType}
            </div>
        `;

        el.addEventListener('click', () => {
            // Highlight item
            document.querySelectorAll('.restaurant-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            
            // Highlight marker & Pan to
            highlightMarker(index, item.lat, item.lon);
        });

        listContainer.appendChild(el);
    });
}

// Render markers on the map
function renderMarkers(data) {
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m.marker));
    markers = [];

    data.forEach((item, index) => {
        if (!item.lat || !item.lon) return;

        const color = getMealColor(item.bua_an);
        const iconClass = getMealIcon(item.bua_an);
        
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="custom-marker" id="marker-${index}" style="background-color: ${color}; border-color: ${color}">
                     <i class="fa-solid ${iconClass}"></i>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const address = Array.isArray(item.dia_chi) ? item.dia_chi[0] : item.dia_chi;

        const marker = L.marker([item.lat, item.lon], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
                <div style="font-family: 'Inter', sans-serif;">
                    <h3 style="margin: 0 0 5px 0; font-size: 16px;">${item.ten_quan}</h3>
                    <p style="margin: 0; font-size: 13px; color: #666;">${address}</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold; color: ${color};">${item.bua_an || 'Chưa phân loại'}</p>
                </div>
            `);

        marker.on('click', () => {
            document.querySelectorAll('.restaurant-item').forEach(i => i.classList.remove('active'));
            const listItem = document.querySelector(`.restaurant-item[data-index="${index}"]`);
            if (listItem) {
                listItem.classList.add('active');
                listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            highlightMarkerUI(index);
        });

        markers.push({ marker, index, item });
    });
}

function highlightMarkerUI(index) {
    document.querySelectorAll('.custom-marker').forEach(m => m.classList.remove('active'));
    const markerEl = document.getElementById(`marker-${index}`);
    if (markerEl) {
        markerEl.classList.add('active');
    }
}

function highlightMarker(index, lat, lon) {
    map.flyTo([lat, lon], 16, { duration: 1.5 });
    
    // Open popup
    const markerObj = markers.find(m => m.index === index);
    if (markerObj) {
        markerObj.marker.openPopup();
    }
    
    setTimeout(() => {
        highlightMarkerUI(index);
    }, 100);
}

function fitMapBounds() {
    if (markers.length === 0) return;
    const group = new L.featureGroup(markers.map(m => m.marker));
    map.fitBounds(group.getBounds(), { padding: [50, 50] });
}

// Search and Filter Logic
function applyFilters() {
    let filtered = allData;

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => {
            if (!item.bua_an) return false;
            return item.bua_an.toLowerCase().includes(currentFilter.toLowerCase());
        });
    }

    // Apply search query
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(item => {
            const nameMatch = item.ten_quan.toLowerCase().includes(q);
            const address = Array.isArray(item.dia_chi) ? item.dia_chi.join(' ') : item.dia_chi;
            const addressMatch = address.toLowerCase().includes(q);
            const mealMatch = (item.bua_an || '').toLowerCase().includes(q);
            return nameMatch || addressMatch || mealMatch;
        });
    }

    renderList(filtered);
    
    // Create a set of visible indices for fast lookup
    const visibleIndices = new Set(filtered.map(item => {
        return allData.findIndex(orig => orig === item);
    }));
    
    // Toggle marker visibility instead of destroying and recreating
    markers.forEach(m => {
        if (visibleIndices.has(m.index)) {
            if (!map.hasLayer(m.marker)) {
                map.addLayer(m.marker);
            }
        } else {
            if (map.hasLayer(m.marker)) {
                map.removeLayer(m.marker);
            }
        }
    });
}

// Event Listeners
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        applyFilters();
    }, 200); // 200ms debounce
});

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        applyFilters();
        fitMapBounds();
    });
});

// Init
loadData();
