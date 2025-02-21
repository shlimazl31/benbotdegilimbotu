import { readFileSync, writeFileSync, existsSync } from 'fs';

const SETTINGS_FILE = 'guildSettings.json';

// Varsayılan ayarlar
const defaultSettings = {
    autoplay: false,
    '247': false,
    volume: 100
};

// Ayarları yükle
let guildSettings = {};

// Dosya varsa oku
if (existsSync(SETTINGS_FILE)) {
    try {
        const data = readFileSync(SETTINGS_FILE, 'utf8');
        guildSettings = JSON.parse(data);
    } catch (error) {
        console.error('Ayarlar dosyası okuma hatası:', error);
        writeFileSync(SETTINGS_FILE, '{}');
    }
} else {
    // Dosya yoksa oluştur
    writeFileSync(SETTINGS_FILE, '{}');
}

// Ayarları kaydet
function saveSettings() {
    try {
        writeFileSync(SETTINGS_FILE, JSON.stringify(guildSettings, null, 2));
    } catch (error) {
        console.error('Ayarlar kaydetme hatası:', error);
    }
}

// Sunucu ayarını al
export function getGuildSetting(guildId, key) {
    if (!guildSettings[guildId]) {
        guildSettings[guildId] = { ...defaultSettings };
        saveSettings();
    }
    return guildSettings[guildId][key] ?? defaultSettings[key];
}

// Sunucu ayarını güncelle
export function setGuildSetting(guildId, key, value) {
    if (!guildSettings[guildId]) {
        guildSettings[guildId] = { ...defaultSettings };
    }
    guildSettings[guildId][key] = value;
    saveSettings();
}

// Tüm sunucu ayarlarını al
export function getAllGuildSettings(guildId) {
    if (!guildSettings[guildId]) {
        guildSettings[guildId] = { ...defaultSettings };
        saveSettings();
    }
    return guildSettings[guildId];
}

// Sunucu ayarlarını sıfırla
export function resetGuildSettings(guildId) {
    guildSettings[guildId] = { ...defaultSettings };
    saveSettings();
} 