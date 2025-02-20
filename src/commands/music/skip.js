import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export const command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Çalan şarkıyı atlar'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply('Önce bir ses kanalına katılmalısın!');
            }

            const queue = useQueue(interaction.guildId);
            if (!queue || !queue.isPlaying()) {
                return await interaction.reply('Şu anda müzik çalmıyor!');
            }

            queue.node.skip();
            return await interaction.reply('⏭️ Şarkı atlandı!');
        } catch (error) {
            console.error(error);
            return await interaction.reply('Bir hata oluştu!');
        }
    }
};
