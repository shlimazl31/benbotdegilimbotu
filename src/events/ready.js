import { REST, Routes } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
            
            // Mevcut komutları kontrol et
            console.log('Mevcut komutlar:', Array.from(client.commands.keys()));
            
            // Komutları topla
            const commands = [];
            client.commands.forEach(command => {
                try {
                    console.log(`Komut işleniyor: ${command.data.name}`);
                    commands.push(command.data.toJSON());
                } catch (error) {
                    console.error(`Komut işlenirken hata (${command.data?.name}):`, error);
                }
            });
            
            if (commands.length === 0) {
                console.error('HATA: Hiç komut bulunamadı!');
                return;
            }

            // REST API'yi hazırla
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            
            try {
                console.log('Slash komutlar yükleniyor...');
                
                // Önce mevcut komutları al
                const existingCommands = await rest.get(
                    Routes.applicationCommands(client.user.id)
                );
                console.log('Mevcut Discord komutları:', existingCommands);
                
                // Yeni komutları kaydet
                const data = await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                );
                
                console.log(`${data.length} komut başarıyla yüklendi:`);
                data.forEach(cmd => console.log(`- ${cmd.name}`));
            } catch (error) {
                console.error('Discord API hatası:', error);
            }
            
        } catch (error) {
            console.error('Ready event hatası:', error);
        }
    }
};
