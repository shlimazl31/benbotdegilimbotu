import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Belirtilen sayıda mesajı siler')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        try {
            const amount = interaction.options.getInteger('miktar');

            // Bot'un izinlerini kontrol et
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({
                    content: 'Mesajları silmek için yetkim yok!',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const messages = await interaction.channel.bulkDelete(amount, true)
                .catch(error => {
                    console.error('Mesaj silme hatası:', error);
                    throw new Error('Mesajlar silinirken bir hata oluştu!');
                });

            await interaction.followUp({
                content: `${messages.size} mesaj başarıyla silindi!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Clear komutu hatası:', error);
            
            if (interaction.deferred) {
                await interaction.followUp({
                    content: error.message || 'Bir hata oluştu!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: error.message || 'Bir hata oluştu!',
                    ephemeral: true
                });
            }
        }
    }
};
