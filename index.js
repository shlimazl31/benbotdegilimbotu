import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { REST, Routes } from 'discord.js';
import { webcrypto } from 'node:crypto';
import { createErelaManager } from './src/utils/erela.js';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import playdl from 'play-dl';
import fs from "fs";

// crypto için global polyfill
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

// .env dosyasını yükle
config();

// __dirname'i ESM için düzelt
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,  // Ses için gerekli
        GatewayIntentBits.MessageContent     // Mesaj içeriği için gerekli
    ]
});

client.commands = new Collection();

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

process.on('uncaughtException', (error) => {
    console.error('Yakalanmamış Hata:', error);
});

// Komutları yükle
try {
    const commands = new Map();
    const foldersPath = join(__dirname, 'src', 'commands');
    const commandFolders = readdirSync(foldersPath);

    console.log('Komut klasörleri:', commandFolders);

    // Paralel komut yükleme
    await Promise.all(commandFolders.map(async (folder) => {
        const commandsPath = join(foldersPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        console.log(`📂 ${folder} klasöründeki komutlar:`, commandFiles);
        
        await Promise.all(commandFiles.map(async (file) => {
            const filePath = `file://${join(commandsPath, file).replace(/\\/g, '/')}`;
            console.log(`⚙️ Dosya yükleniyor: ${filePath}`);
            
            try {
                const commandModule = await import(filePath);
                
                if (!commandModule.command) {
                    console.error(`❌ ${file} dosyasında 'command' export bulunamadı`);
                    return;
                }

                if (!commandModule.command.data) {
                    console.error(`❌ ${file} dosyasında 'command.data' bulunamadı`);
                    return;
                }

                const commandName = commandModule.command.data.name;

                if (commands.has(commandName)) {
                    console.error(`❌ HATA: '${commandName}' komutu birden fazla kez tanımlanmış!`);
                    console.error(`   İlk tanım: ${commands.get(commandName)}`);
                    console.error(`   İkinci tanım: ${filePath}`);
                    return;
                }

                commands.set(commandName, filePath);
                client.commands.set(commandName, commandModule.command);
                console.log(`✅ Komut başarıyla yüklendi: ${commandName}`);
            } catch (error) {
                console.error(`❌ ${file} komut dosyası yüklenirken hata:`, error);
            }
        }));
    }));

    // Komutları Discord'a kaydet
    const rest = new REST().setToken(process.env.TOKEN);
    try {
        console.log('Slash komutları Discord\'a yükleniyor...');
        
        // Map'ten Array'e çevir ve sadece komut verilerini al
        const commandsArray = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandsArray }
        );
        console.log('✅ Slash komutları başarıyla Discord\'a yüklendi!');
    } catch (error) {
        console.error('Discord\'a komut yükleme hatası:', error);
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

// Erela.js'i başlat
client.manager = createErelaManager(client);

// Player event listeners
client.manager.on('error', (error) => {
    console.error('Player error:', error);
});

client.manager.on('playerError', (player, error) => {
    console.error(`Player error in guild ${player.guild}:`, error);
    player.textChannel?.send(`❌ Bir oynatma hatası oluştu: ${error.message}`).catch(console.error);
});

// YouTube cookie dosyasını yükle
await playdl.setCookie("./www.youtube.com_cookies.txt");
if (!fs.existsSync("./www.youtube.com_cookies.txt")) {
  console.error("YouTube cookie dosyası bulunamadı!");
} else {
  console.log("YouTube cookie dosyası bulundu ve yüklendi.");
}

// Bot başlatma ve giriş
client.login(process.env.TOKEN);

// Express sunucusu oluştur
const app = express();
const port = process.env.PORT || 3000;

// Trust proxy ayarı
app.set('trust proxy', 1);

// Rate limiter ayarları
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100 // IP başına limit
});

// CORS ayarları
app.use(cors({
    origin: ['https://benbotdegilim.online', 'https://benbotdegilim.online/callback'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Bot durumu endpoint'i
app.get('/api/bot/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: client.uptime,
        guilds: client.guilds.cache.size,
        ping: client.ws.ping
    });
});

// Sunucular endpoint'i
app.get('/api/bot/guilds', (req, res) => {
    const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        icon: guild.iconURL()
    }));
    res.json(guilds);
});

// Müzik kontrolü endpoint'i
app.post('/api/bot/music/:guildId/:action', async (req, res) => {
    const { guildId, action } = req.params;
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
        return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    const player = client.manager.get(guildId);

    try {
        switch (action) {
            case 'play':
                // Müzik çalma işlemleri
                break;
            case 'pause':
                if (player) player.pause(true);
                break;
            case 'resume':
                if (player) player.pause(false);
                break;
            case 'stop':
                if (player) player.destroy();
                break;
            default:
                return res.status(400).json({ error: 'Geçersiz işlem' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sunucu ayarları endpoint'i
app.get('/api/bot/guilds/:guildId/settings', (req, res) => {
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
        return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }

    // Sunucu ayarlarını döndür
    res.json({
        id: guild.id,
        name: guild.name,
        // Diğer ayarlar buraya eklenecek
    });
});

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`API sunucusu ${port} portunda çalışıyor`);
});