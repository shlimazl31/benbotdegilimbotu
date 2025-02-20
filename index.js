import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

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

// Komutları yükle
client.commands = new Collection();

try {
    // Komutları yükle
    const foldersPath = join(__dirname, 'src', 'commands');
    const commandFolders = readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = join(foldersPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        console.log(`${folder} klasöründeki komutlar yükleniyor...`);
        
        for (const file of commandFiles) {
            const filePath = `file://${join(commandsPath, file).replace(/\\/g, '/')}`;
            console.log(`Yükleniyor: ${file}`);
            
            const command = await import(filePath);
            
            if ('command' in command) {
                client.commands.set(command.command.data.name, command.command);
                console.log(`Komut yüklendi: ${command.command.data.name}`);
            } else {
                console.log(`[UYARI] ${file} komut dosyasında gerekli özellikler eksik`);
            }
        }
    }

    // Event'leri yükle
    const eventsPath = join(__dirname, 'src', 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = `file://${join(eventsPath, file).replace(/\\/g, '/')}`;
        const event = await import(filePath);
        
        if (event.event.once) {
            client.once(event.event.name, (...args) => event.event.execute(...args));
        } else {
            client.on(event.event.name, (...args) => event.event.execute(...args));
        }
    }

} catch (error) {
    console.error('Dosyalar yüklenirken hata oluştu:', error);
}

client.login(process.env.TOKEN);