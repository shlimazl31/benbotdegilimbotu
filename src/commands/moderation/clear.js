import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Belirtilen sayıda mesajı siler')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Kaç mesaj silinecek? (1-100 arası)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            const miktar = interaction.options.getInteger('miktar');
            const silinecekMesajlar = await interaction.channel.messages.fetch({ limit: miktar });
            await interaction.channel.bulkDelete(silinecekMesajlar);
            await interaction.reply({ 
                content: `${miktar} mesaj başarıyla silindi!`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error('Mesajlar silinirken hata oluştu:', error);
            await interaction.reply({ 
                content: 'Mesajlar silinirken bir hata oluştu. 14 günden eski mesajlar silinemez.', 
                ephemeral: true 
            });
        }
    }
};
