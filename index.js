import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { REST, Routes } from 'discord.js';
import { webcrypto } from 'node:crypto';
import { Player } from 'discord-player';
import { YouTubeExtractor } from '@discord-player/extractor';

// crypto için global polyfill
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

// .env dosyasını yükle
config();

// __dirname'i ESM için düzelt
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug için DefaultExtractors'ı kontrol et
console.log('DefaultExtractors:', YouTubeExtractor);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,  // Ses için gerekli
        GatewayIntentBits.MessageContent     // Mesaj içeriği için gerekli
    ]
});

client.commands = new Collection();

// Global player instance'ı oluştur
const player = new Player(client);

// Sadece YouTube extractoru kullan
await player.extractors.register(YouTubeExtractor);

// Player eventlerini ayarla
player.events.on('playerStart', (queue, track) => {
    queue.metadata.send(`🎵 Şimdi çalıyor: **${track.title}**!`);
});

player.events.on('error', (queue, error) => {
    console.error('Player hatası:', error);
    queue.metadata?.send('❌ Bir hata oluştu!');
});

// Process handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM sinyali alındı. Graceful shutdown başlatılıyor...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT sinyali alındı. Graceful shutdown başlatılıyor...');
    client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('Yakalanmamış Promise Reddi:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Yakalanmamış Hata:', error);
});

// Komutları yükle
try {
    const foldersPath = join(__dirname, 'src', 'commands');
    const commandFolders = readdirSync(foldersPath);

    console.log('Komut klasörleri:', commandFolders);

    for (const folder of commandFolders) {
        const commandsPath = join(foldersPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        console.log(`📂 ${folder} klasöründeki komutlar:`, commandFiles);
        
        for (const file of commandFiles) {
            const filePath = `file://${join(commandsPath, file).replace(/\\/g, '/')}`;
            console.log(`⚙️ Dosya yükleniyor: ${filePath}`);
            
            try {
                const commandModule = await import(filePath);
                console.log(`📦 Modül içeriği (${file}):`, commandModule);
                
                if (!commandModule.command) {
                    console.error(`❌ ${file} dosyasında 'command' export bulunamadı`);
                    continue;
                }

                if (!commandModule.command.data) {
                    console.error(`❌ ${file} dosyasında 'command.data' bulunamadı`);
                    continue;
                }

                const commandName = commandModule.command.data.name;
                console.log(`✨ Komut adı: ${commandName}`);
                
                client.commands.set(commandName, commandModule.command);
                console.log(`✅ Komut başarıyla yüklendi: ${commandName}`);
            } catch (error) {
                console.error(`❌ ${file} komut dosyası yüklenirken hata:`, error);
            }
        }
    }

    const loadedCommands = Array.from(client.commands.keys());
    console.log('✅ Yüklenen tüm komutlar:', loadedCommands);
    
    if (loadedCommands.length === 0) {
        console.error('⚠️ UYARI: Hiç komut yüklenemedi!');
    }

    // Event'leri yükle
    const eventsPath = join(__dirname, 'src', 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const filePath = `file://${join(eventsPath, file).replace(/\\/g, '/')}`;
            const event = await import(filePath);
            
            if ('event' in event) {
                if (event.event.once) {
                    client.once(event.event.name, (...args) => event.event.execute(...args));
                } else {
                    client.on(event.event.name, (...args) => event.event.execute(...args));
                }
                console.log(`✅ Event başarıyla yüklendi: ${event.event.name}`);
            }
        } catch (error) {
            console.error(`❌ ${file} event dosyası yüklenirken hata:`, error);
        }
    }
} catch (error) {
    console.error('Komut/Event yükleme hatası:', error);
}

client.login(process.env.TOKEN);