// Map initialization
const map = L.map('map').setView([20.8449, 106.6881], 13); // Default Hai Phong

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Marker Cluster Group
const markerClusterGroup = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    maxClusterRadius: 50
});
map.addLayer(markerClusterGroup);

markerClusterGroup.on('clusterclick', function (a) {
    let paddingBottom = 50;
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.classList.contains('collapsed')) {
            paddingBottom = window.innerHeight * 0.55 + 20;
        } else {
            paddingBottom = 80;
        }
    }

    a.layer.zoomToBounds({
        paddingBottomRight: [50, paddingBottom],
        paddingTopLeft: [50, 50]
    });
});

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
    // Clear existing markers from cluster
    markerClusterGroup.clearLayers();
    markers = [];

    const newMarkers = [];
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
        newMarkers.push(marker);
    });

    markerClusterGroup.addLayers(newMarkers);
}

function highlightMarkerUI(index) {
    document.querySelectorAll('.custom-marker').forEach(m => m.classList.remove('active'));
    const markerEl = document.getElementById(`marker-${index}`);
    if (markerEl) {
        markerEl.classList.add('active');
    }
}

function highlightMarker(index, lat, lon) {
    const markerObj = markers.find(m => m.index === index);
    if (markerObj) {
        // Automatically zoom to cluster if needed before opening popup
        markerClusterGroup.zoomToShowLayer(markerObj.marker, () => {
            map.flyTo([lat, lon], 16, { duration: 1.5 });
            markerObj.marker.openPopup();
            setTimeout(() => {
                highlightMarkerUI(index);
            }, 100);
        });
    }

    // Mobile: Collapse sidebar when clicking a restaurant from list to see it on map
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.add('collapsed');
    }
}

function fitMapBounds() {
    if (markers.length === 0) return;
    const group = new L.featureGroup(markers.map(m => m.marker));
    
    let paddingBottom = 50;
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.classList.contains('collapsed')) {
            paddingBottom = window.innerHeight * 0.55 + 20;
        } else {
            paddingBottom = 80;
        }
    }
    
    map.fitBounds(group.getBounds(), {
        paddingBottomRight: [50, paddingBottom],
        paddingTopLeft: [50, 50]
    });
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
    
    // Toggle marker visibility by updating cluster group
    const visibleMarkers = [];
    markers.forEach(m => {
        if (visibleIndices.has(m.index)) {
            visibleMarkers.push(m.marker);
        }
    });
    
    markerClusterGroup.clearLayers();
    markerClusterGroup.addLayers(visibleMarkers);
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

// Add Ga Hai Phong Marker and Circle
const gaHaiPhongCoords = [20.8525, 106.6853];

const gaHaiPhongIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-marker" style="background-color: var(--color-breakfast); border-color: white; z-index: 1000;">
             <i class="fa-solid fa-train"></i>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const gaHaiPhongMarker = L.marker(gaHaiPhongCoords, { icon: gaHaiPhongIcon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup(`
        <div style="font-family: 'Inter', sans-serif;">
            <h3 style="margin: 0 0 5px 0; font-size: 16px;">Ga Hải Phòng</h3>
            <p style="margin: 0; font-size: 13px; color: #666;">75 Lương Khánh Thiện</p>
        </div>
    `);

// 12km radius circle
let radiusInKm = 4;
let radiusCircle = L.circle(gaHaiPhongCoords, {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.1, // Easy to see other parts
    weight: 2,
    dashArray: '5, 5', // Dashed border
    radius: radiusInKm * 1000 // Convert to meters
}).addTo(map);

// Radius slider logic
const radiusSlider = document.getElementById('radiusSlider');
const radiusValueLabel = document.getElementById('radiusValue');

if (radiusSlider && radiusValueLabel) {
    radiusSlider.addEventListener('input', (e) => {
        radiusInKm = parseInt(e.target.value, 10);
        radiusValueLabel.textContent = `${radiusInKm} km`;
        radiusCircle.setRadius(radiusInKm * 1000);
    });
}

// Init
loadData();

// Mobile bottom sheet toggle
const sidebar = document.querySelector('.sidebar');
const sidebarHeader = document.querySelector('.sidebar-header');

if (sidebar && sidebarHeader) {
    sidebarHeader.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('collapsed');
        }
    });
}
