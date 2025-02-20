import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { useQueue } from 'discord-player';

export const command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Müziği durdurur'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply('Önce bir ses kanalına katılmalısın!');
            }

            const queue = useQueue(interaction.guildId);
            if (!queue || !queue.isPlaying()) {
                return await interaction.reply('Şu anda müzik çalmıyor!');
            }

            queue.delete();
            return await interaction.reply('⏹️ Müzik durduruldu!');
        } catch (error) {
            console.error(error);
            return await interaction.reply('Bir hata oluştu!');
        }
    }
};
