export const event = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`${interaction.commandName} komutu bulunamadı.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`${interaction.commandName} komutu çalıştırılırken hata:`, error);
            const replyContent = {
                content: 'Bu komut çalıştırılırken bir hata oluştu!',
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
