import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { config } from 'dotenv';

// Çevre değişkenlerini yükle
config();

// ESM için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bot istemcisini oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Komut koleksiyonunu oluştur
client.commands = new Collection();

// Hata yönetimi için process handlers
process.on('unhandledRejection', (error) => {
    console.error('🔴 İşlenmeyen Promise Reddi:', error);
});

process.on('uncaughtException', (error) => {
    console.error('🔴 Yakalanmayan Hata:', error);
});

// Komutları yükle
async function loadCommands() {
    try {
        const commandsPath = join(__dirname, 'commands');
        const commandFolders = readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = join(commandsPath, folder);
            const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = join(folderPath, file);
                const command = await import(filePath);

                if ('command' in command && 'execute' in command.command) {
                    client.commands.set(command.command.data.name, command.command);
                    console.log(`✅ Komut yüklendi: ${command.command.data.name}`);
                } else {
                    console.log(`⚠️ ${filePath} geçersiz komut yapısına sahip`);
                }
            }
        }
    } catch (error) {
        console.error('🔴 Komutlar yüklenirken hata:', error);
    }
}

// Komutları global olarak kaydet
async function deployCommands() {
    try {
        const commands = [];
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        console.log('🔄 Slash komutlar kaydediliyor...');
        
        // Önce mevcut komutları temizle
        await client.application?.commands.set([]);
        
        // Yeni komutları kaydet
        const data = await client.application?.commands.set(commands);
        console.log(`✅ ${data?.size || 0} slash komut başarıyla kaydedildi`);
    } catch (error) {
        console.error('🔴 Slash komutlar kaydedilirken hata:', error);
    }
}

// Bot hazır olduğunda
client.once(Events.ClientReady, async () => {
    console.log(`🟢 Bot ${client.user.tag} olarak giriş yaptı`);
    await loadCommands();
    await deployCommands();
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        // Interaction geçerliliğini kontrol et
        if (!interaction.isRepliable()) {
            console.error(`🔴 Interaction yanıtlanamaz durumda: ${interaction.commandName}`);
            return;
        }

        // Komutu bul
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`🔴 Komut bulunamadı: ${interaction.commandName}`);
            await interaction.reply({ 
                content: 'Bu komut artık mevcut değil.',
                ephemeral: true 
            });
            return;
        }

        // Sunucu bilgilerini logla
        console.log(`🔵 Komut çalıştırılıyor: ${interaction.commandName}`);
        console.log(`📍 Sunucu: ${interaction.guild?.name} (${interaction.guild?.id})`);
        console.log(`👤 Kullanıcı: ${interaction.user.tag} (${interaction.user.id})`);

        // Bot yetkilerini kontrol et
        const botMember = interaction.guild?.members.cache.get(client.user.id);
        if (!botMember) {
            console.error('🔴 Bot üye bilgisi alınamadı');
            await interaction.reply({
                content: 'Bot yetkileri kontrol edilemiyor.',
                ephemeral: true
            });
            return;
        }

        // Gerekli yetkileri kontrol et
        const requiredPermissions = ['Connect', 'Speak', 'ViewChannel', 'SendMessages', 'EmbedLinks'];
        const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));

        if (missingPermissions.length > 0) {
            console.error(`🔴 Eksik yetkiler: ${missingPermissions.join(', ')}`);
            await interaction.reply({
                content: `Bot için gerekli yetkiler eksik: ${missingPermissions.join(', ')}`,
                ephemeral: true
            });
            return;
        }

        // Komutu çalıştır
        await command.execute(interaction);

    } catch (error) {
        console.error('🔴 Komut çalıştırılırken hata:', error);

        // Interaction'ın hala geçerli olup olmadığını kontrol et
        if (interaction.isRepliable()) {
            const errorMessage = {
                content: 'Bu komut çalıştırılırken bir hata oluştu.',
                ephemeral: true
            };

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(errorMessage).catch(console.error);
            } else {
                await interaction.reply(errorMessage).catch(console.error);
            }
        }
    }
});

// Bota giriş yap
client.login(process.env.TOKEN); 