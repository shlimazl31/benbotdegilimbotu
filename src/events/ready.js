import { REST, Routes } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
            
            // Komutları topla
            const commands = [];
            client.commands.forEach(command => {
                console.log(`Komut yükleniyor: ${command.data.name}`);
                commands.push(command.data.toJSON());
            });
            
            console.log('Komutlar hazırlanıyor...');
            console.log('Komut listesi:', commands);
            
            // REST API'yi hazırla
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            
            console.log('Slash komutlar yükleniyor...');
            
            // Global komutları kaydet
            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            
            console.log(`${data.length} slash komut başarıyla yüklendi!`);
            console.log(`${client.user.tag} hazır!`);
            
        } catch (error) {
            console.error('Komutlar yüklenirken hata:', error);
        }
    }
};
