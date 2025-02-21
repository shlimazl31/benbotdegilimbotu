export const event = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Debug için
        console.log(`Komut çalıştırıldı: ${interaction.commandName}`);

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`Komut bulunamadı: ${interaction.commandName}`);
            return;
        }

        try {
            console.log(`${interaction.commandName} komutu çalıştırılıyor...`);
            await command.execute(interaction);
        } catch (error) {
            console.error(`Komut hatası (${interaction.commandName}):`, error);
            const replyContent = {
                content: 'Bu komutu çalıştırırken bir hata oluştu!',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyContent);
            } else {
                await interaction.reply(replyContent);
            }
        }
    }
};
