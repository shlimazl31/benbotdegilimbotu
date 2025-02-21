import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { REST, Routes } from 'discord.js';
import { webcrypto } from 'node:crypto';

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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
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
client.commands = new Collection();

try {
    // Komutları yükle
    const foldersPath = join(__dirname, 'src', 'commands');
    const commandFolders = readdirSync(foldersPath);

    console.log('Komut klasörleri:', commandFolders);

    for (const folder of commandFolders) {
        const commandsPath = join(foldersPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        console.log(`📂 ${folder} klasöründeki komutlar:`, commandFiles);
        
        for (const file of commandFiles) {
            try {
                const filePath = `file://${join(commandsPath, file).replace(/\\/g, '/')}`;
                console.log(`⚙️ Yükleniyor: ${file}`);
                
                const command = await import(filePath);
                
                if ('command' in command && command.command.data) {
                    client.commands.set(command.command.data.name, command.command);
                    console.log(`✅ Komut yüklendi: ${command.command.data.name}`);
                } else {
                    console.log(`⚠️ [UYARI] ${file} komut yapısı hatalı:`, command);
                }
            } catch (error) {
                console.error(`❌ ${file} komut dosyası yüklenirken hata:`, error);
            }
        }
    }

    console.log('Yüklenen komutlar:', Array.from(client.commands.keys()));

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
                console.log(`✅ Event yüklendi${event.event.once ? ' (once)' : ''}: ${event.event.name}`);
            }
        } catch (eventError) {
            console.error(`❌ ${file} event dosyası yüklenirken hata oluştu:`, eventError);
        }
    }
} catch (error) {
    console.error('Genel bir hata oluştu:', error);
}

// Bot'u başlat
client.login(process.env.TOKEN)
    .then(() => console.log('Bot başarıyla giriş yaptı!'))
    .catch(error => {
        console.error('Bot başlatılırken hata:', error);
        process.exit(1);
    });