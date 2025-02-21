import { REST, Routes } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
        
        try {
            console.log('Komutlar yükleniyor...');
            // Global komutları kaydet
            const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
            console.log('Kaydedilecek komutlar:', commands);
            
            const rest = new REST().setToken(process.env.TOKEN);
            
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            
            console.log('Komutlar başarıyla yüklendi!');
            console.log(`${client.user.tag} hazır!`);
        } catch (error) {
            console.error('Komutlar yüklenirken hata:', error);
        }
    }
};
