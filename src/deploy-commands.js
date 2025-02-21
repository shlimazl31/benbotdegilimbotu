import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

console.log('Komut klasörleri:', commandFolders);

for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log(`📂 ${folder} klasöründeki komutlar:`, commandFiles);
    
    for (const file of commandFiles) {
        const filePath = `file://${join(commandsPath, file).replace(/\\/g, '/')}`;
        console.log(`⚙️ Yükleniyor: ${filePath}`);
        
        try {
            const command = await import(filePath);
            
            if ('command' in command && 'data' in command.command) {
                commands.push(command.command.data.toJSON());
                console.log(`✅ Komut yüklendi: ${command.command.data.name}`);
            } else {
                console.log(`❌ ${file} komutunda gerekli özellikler eksik`);
            }
        } catch (error) {
            console.error(`❌ ${file} yüklenirken hata:`, error);
        }
    }
}

console.log('Yüklenecek komutlar:', commands.map(cmd => cmd.name));

const rest = new REST().setToken(process.env.TOKEN);

try {
    console.log('Slash komutları yükleniyor...');

    const result = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
    );

    console.log('API Yanıtı:', result);
    console.log('Slash komutları başarıyla yüklendi!');
} catch (error) {
    console.error('Komut yükleme hatası:', error);
} 