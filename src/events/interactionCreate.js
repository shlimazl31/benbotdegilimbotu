export const event = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`Komut bulunamadı: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Komut hatası (${interaction.commandName}):`, error);
            
            try {
                const errorMessage = {
                    content: 'Bu komutu çalıştırırken bir hata oluştu!',
                    ephemeral: true
                };

                if (interaction.deferred) {
                    await interaction.editReply(errorMessage);
                } else if (!interaction.replied) {
                    await interaction.reply(errorMessage);
                }
            } catch (err) {
                console.error('Hata mesajı gönderilirken ikinci bir hata oluştu:', err);
            }
        }
    }
};
