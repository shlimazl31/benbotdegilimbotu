import { Events } from 'discord.js';

export const event = {
    name: Events.InteractionCreate,
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
            console.error(`Komut hatası (${interaction.commandName}):`, error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Komut çalıştırılırken bir hata oluştu!',
                        ephemeral: true
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Komut çalıştırılırken bir hata oluştu!',
                        ephemeral: true
                    });
                }
            } catch (err) {
                console.error('Hata mesajı gönderilirken ikinci bir hata oluştu:', err);
            }
        }
    }
};
