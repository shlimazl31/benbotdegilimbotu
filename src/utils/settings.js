import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const settingsPath = join(__dirname, '..', 'config', 'settings.json');

export function getSettings() {
    try {
        const data = readFileSync(settingsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        return { defaultVolume: 100, guildSettings: {} };
    }
}

export function saveSettings(settings) {
    try {
        writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
    } catch (error) {
        console.error('Ayarlar kaydedilirken hata:', error);
    }
}

export function getGuildVolume(guildId) {
    const settings = getSettings();
    return settings.guildSettings[guildId]?.volume || settings.defaultVolume;
}

export function setGuildVolume(guildId, volume) {
    const settings = getSettings();
    if (!settings.guildSettings[guildId]) {
        settings.guildSettings[guildId] = {};
    }
    settings.guildSettings[guildId].volume = volume;
    saveSettings(settings);
} 