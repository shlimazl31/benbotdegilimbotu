import { SlashCommandBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Müziği durdurur ve sırayı temizler'),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const player = interaction.client.manager.get(interaction.guild.id);
            if (!player) {
                return interaction.editReply({
                    content: '❌ Şu anda çalan bir müzik yok!',
                    ephemeral: true
                });
            }

            const { channel } = interaction.member.voice;
            if (!channel) {
                return interaction.editReply({
                    content: '❌ Bir ses kanalında olmalısın!',
                    ephemeral: true
                });
            }

            if (channel.id !== player.voiceChannel) {
                return interaction.editReply({
                    content: '❌ Bot ile aynı ses kanalında olmalısın!',
                    ephemeral: true
                });
            }

            player.destroy();
            await interaction.editReply({
                content: '⏹️ Müzik durduruldu ve sıra temizlendi!'
            });
        } catch (error) {
            console.error('Stop hatası:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Bir hata oluştu!',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: '❌ Bir hata oluştu!',
                    ephemeral: true
                });
            }
        }
    }
};
