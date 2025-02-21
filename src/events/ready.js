export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
        
        try {
            console.log('Komutlar yükleniyor...');
            await client.application.commands.set(client.commands.map(cmd => cmd.data));
            console.log('Komutlar başarıyla yüklendi!');
            console.log(`${client.user.tag} hazır!`);
        } catch (error) {
            console.error('Komutlar yüklenirken hata:', error);
        }
    }
};
