const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data_with_coords.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const records = JSON.parse(rawData);

// Dictionary of better coordinates manually curated
const betterCoords = {
    "Cafe cốt dừa cô Hạnh": { lat: 20.8465, lon: 106.6668 }, // Lam Son
    "Bánh đa cua cô Yến": { lat: 20.8672, lon: 106.6826 }, // Tran Hung Dao
    "Bánh giò Hoàng Văn Thụ": { lat: 20.8665, lon: 106.6835 }, // Tran Quang Khai
    "Bún cá Cậu Đoành": { lat: 20.8395, lon: 106.6780 }, // Ho Sen
    "Chè Trang": { lat: 20.8525, lon: 106.6738 }, // Hai Ba Trung (Cat Dai)
    "Bánh đa cua": { lat: 20.8485, lon: 106.6890 }, // Lach Tray
    "Trà cúc Diamond": { lat: 20.8617, lon: 106.6846 }, // Minh Khai
    "Nem cua bể Nga 92": { lat: 20.8555, lon: 106.6834 }, // Tran Nhat Duat
    "Bánh mỳ pate Ông Bà Cụ": { lat: 20.8510, lon: 106.6720 }, // Cat Dai
    "Bánh đúc tàu": { lat: 20.8525, lon: 106.6738 }, // Cat Dai
    "Hoa ốc": { lat: 20.8638, lon: 106.6962 }, // May To
    "Trà cúc Cô Lý": { lat: 20.8622, lon: 106.6815 }, // Dinh Tien Hoang
    "Cafe 1986": { lat: 20.8642, lon: 106.6826 }, // Dinh Tien Hoang
    "Ốc cô Lời": { lat: 20.8415, lon: 106.6765 }, // Mieu Hai Xa
    "Bún cá cay": { lat: 20.8550, lon: 106.6900 }, // Le Loi
    "Bún cá Cô Hường": { lat: 20.8455, lon: 106.6829 }, // Nguyen Cong Tru
    "Nem chua bà cụ": { lat: 20.8561, lon: 106.6753 }, // Phan Boi Chau
    "Lẩu cua đồng": { lat: 20.8350, lon: 106.7020 } // Lach Tray (xa trung tam hon)
};

records.forEach(record => {
    if (betterCoords[record.ten_quan]) {
        record.lat = betterCoords[record.ten_quan].lat;
        record.lon = betterCoords[record.ten_quan].lon;
    }
});

fs.writeFileSync(dataPath, JSON.stringify(records, null, 2), 'utf8');
console.log('Coordinates updated manually.');
