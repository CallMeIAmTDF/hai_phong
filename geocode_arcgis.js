const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'data.json');
const outputPath = path.join(__dirname, 'data_with_coords.json');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function geocode(address) {
    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodedAddress}&maxLocations=1`;
        console.log(`Geocoding: ${address}`);
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.candidates && data.candidates.length > 0) {
            const location = data.candidates[0].location;
            return {
                lat: location.y,
                lon: location.x
            };
        }
        return null;
    } catch (err) {
        console.error(`Error geocoding ${address}:`, err);
        return null;
    }
}

async function run() {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const records = JSON.parse(rawData);
    
    // Default coords for Hai Phong center
    const defaultCoords = { lat: 20.8449, lon: 106.6881 };

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // Handle array of addresses by taking the first one
        let address = record.dia_chi;
        if (Array.isArray(address)) {
            address = address[0];
        }
        
        // Ensure "Hải Phòng" is in the address to improve geocoding
        if (!address.toLowerCase().includes('hải phòng')) {
            address += ', Hải Phòng';
        }
        
        let coords = await geocode(address);
        
        if (!coords) {
            console.warn(`Could not geocode exactly: ${address}. Using default Hai Phong coordinates.`);
            coords = {
                lat: defaultCoords.lat + (Math.random() - 0.5) * 0.01,
                lon: defaultCoords.lon + (Math.random() - 0.5) * 0.01
            };
        }
        
        record.lat = coords.lat;
        record.lon = coords.lon;
        
        // Rate limiting just to be safe with public API
        await delay(500); 
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf8');
    console.log('ArcGIS Geocoding completed. Saved to data_with_coords.json');
}

run();
