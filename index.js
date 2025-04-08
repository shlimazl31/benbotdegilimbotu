import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { REST, Routes } from 'discord.js';
import { webcrypto } from 'node:crypto';
import { getPlayer } from './src/utils/player.js';

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

process.on('unhandledRejection', (error) => {
    console.error('Yakalanmamış Promise Reddi:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Yakalanmamış Hata:', error);
});

// Komutları yükle
try {
    const commands = new Map();  // Tekrar eden komutları kontrol etmek için Map kullanıyoruz
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
                
                if (!commandModule.command) {
                    console.error(`❌ ${file} dosyasında 'command' export bulunamadı`);
                    continue;
                }

                if (!commandModule.command.data) {
                    console.error(`❌ ${file} dosyasında 'command.data' bulunamadı`);
                    continue;
                }

                const commandName = commandModule.command.data.name;

                // Tekrar eden komut kontrolü
                if (commands.has(commandName)) {
                    console.error(`❌ HATA: '${commandName}' komutu birden fazla kez tanımlanmış!`);
                    console.error(`   İlk tanım: ${commands.get(commandName)}`);
                    console.error(`   İkinci tanım: ${filePath}`);
                    continue;
                }

                commands.set(commandName, filePath);
                client.commands.set(commandName, commandModule.command);
                console.log(`✅ Komut başarıyla yüklendi: ${commandName}`);
            } catch (error) {
                console.error(`❌ ${file} komut dosyası yüklenirken hata:`, error);
            }
        }
    }

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

// Player'ı başlat
async function initializePlayer(client) {
    try {
        await getPlayer(client);
        console.log('✅ Discord Player başlatıldı');
    } catch (error) {
        console.error('❌ Discord Player başlatma hatası:', error);
    }
}

// Bot başlatma ve giriş
await initializePlayer(client);
client.login(process.env.TOKEN);