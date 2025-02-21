import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Belirtilen sayıda mesajı siler')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const amount = interaction.options.getInteger('miktar');
            const messages = await interaction.channel.bulkDelete(amount, true);

            return await interaction.followUp({
                content: `✅ ${messages.size} mesaj silindi!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Purge hatası:', error);
            return await interaction.followUp({
                content: '❌ Mesajlar silinirken bir hata oluştu! (14 günden eski mesajlar silinemez)',
                ephemeral: true
            });
        }
    }
};