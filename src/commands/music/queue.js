import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Şarkı sırasını gösterir'),

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

            const tracks = queue.tracks.data;
            const currentTrack = queue.currentTrack;
            let description = `Şu an çalıyor: **${currentTrack.title}**\n\n`;

            if (tracks.length === 0) {
                description += '*Sırada başka şarkı yok*';
            } else {
                const trackList = tracks
                    .slice(0, 10)
                    .map((track, i) => `${i + 1}. **${track.title}**`)
                    .join('\n');
                
                description += `**Sıradaki Şarkılar:**\n${trackList}`;
                
                if (tracks.length > 10) {
                    description += `\n\n*ve ${tracks.length - 10} şarkı daha...*`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şarkı Sırası')
                .setDescription(description)
                .setColor('#FF0000');

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Queue hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};
