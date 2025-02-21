import { REST, Routes } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
            
            // Komutları topla
            const commands = [];
            console.log('Mevcut komutlar:', client.commands);
            
            client.commands.forEach(command => {
                try {
                    console.log(`Komut işleniyor: ${command.data.name}`);
                    const jsonData = command.data.toJSON();
                    console.log('Komut JSON:', jsonData);
                    commands.push(jsonData);
                } catch (error) {
                    console.error('Komut işlenirken hata:', error);
                }
            });
            
            console.log('İşlenen komutlar:', commands);
            
            if (commands.length === 0) {
                console.error('HATA: Hiç komut yüklenemedi!');
                return;
            }
            
            // REST API'yi hazırla
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
            
            console.log('Slash komutlar yükleniyor...');
            
            try {
                // Global komutları kaydet
                const data = await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                );
                
                console.log(`${data.length} komut başarıyla yüklendi:`);
                data.forEach(cmd => console.log(`- ${cmd.name}`));
            } catch (error) {
                console.error('Komutlar Discord\'a kaydedilirken hata:', error);
            }
            
        } catch (error) {
            console.error('Ready event\'inde hata:', error);
        }
    }
};
