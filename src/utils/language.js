import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const languages = {};
const defaultLanguage = 'tr';

// Dil dosyalarını yükle
['tr', 'en', 'de'].forEach(lang => {
    const path = join(__dirname, '..', 'locales', lang, `${lang}.json`);
    try {
        languages[lang] = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
        console.error(`${lang}/${lang}.json yüklenemedi:`, error);
        languages[lang] = {};
    }
});

function getGuildSettings() {
    try {
        const path = join(__dirname, '..', 'config', 'guild-settings.json');
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return { guilds: {} };
    }
}

function saveGuildSettings(settings) {
    const path = join(__dirname, '..', 'config', 'guild-settings.json');
    writeFileSync(path, JSON.stringify(settings, null, 2));
}

export function getGuildLanguage(guildId) {
    const settings = getGuildSettings();
    return settings.guilds[guildId]?.language || defaultLanguage;
}

export function setGuildLanguage(guildId, language) {
    if (!['tr', 'en', 'de'].includes(language)) {
        throw new Error('Geçersiz dil');
    }
    const settings = getGuildSettings();
    if (!settings.guilds[guildId]) settings.guilds[guildId] = {};
    settings.guilds[guildId].language = language;
    saveGuildSettings(settings);
}

export function translate(key, guildId, category = 'messages', replacements = {}) {
    const lang = getGuildLanguage(guildId);
    const keys = key.split('.');
    
    // Önce seçilen dilde ara
    let text = keys.reduce((obj, k) => obj?.[k], languages[lang]?.[category]);
    
    // Bulunamazsa varsayılan dilde ara
    if (!text) {
        text = keys.reduce((obj, k) => obj?.[k], languages[defaultLanguage]?.[category]);
    }

    if (!text) return key;

    // Değişkenleri değiştir
    Object.entries(replacements).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value);
    });

    return text;
}