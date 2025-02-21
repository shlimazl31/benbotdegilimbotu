import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync } from 'node:fs';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Komutları yükle
const foldersPath = join(__dirname, 'src', 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = `file://${join(commandsPath, file).replace(/\\/g, '/')}`;
        const command = await import(filePath);
        
        if ('command' in command && 'data' in command.command) {
            commands.push(command.command.data.toJSON());
        }
    }
}

// Discord API'ye gönder
const rest = new REST().setToken(process.env.TOKEN);

try {
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
    );
    
    console.log('✅ Komutlar başarıyla yüklendi!');
} catch (error) {
    console.error('❌ Hata:', error);
} 