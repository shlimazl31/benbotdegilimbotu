export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot olarak giriş yapıldı: ${client.user.tag}`);
        
        try {
            const commands = client.commands.map(command => command.data);
            await client.application.commands.set(commands);
            console.log('Slash komutları başarıyla kaydedildi!');
        } catch (error) {
            console.error('Slash komutları kaydedilirken hata oluştu:', error);
        }
    }
};
