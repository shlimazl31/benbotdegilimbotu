import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Ses seviyesini ayarlar')
        .addIntegerOption(option =>
            option.setName('seviye')
                .setDescription('Ses seviyesi (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const volume = interaction.options.getInteger('seviye');
            queue.node.setVolume(volume);

            await interaction.reply(`🔊 Ses seviyesi **${volume}%** olarak ayarlandı!`);
        } catch (error) {
            console.error('Volume hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 