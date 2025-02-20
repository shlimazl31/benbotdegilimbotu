import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Şarkı sırasını gösterir'),

    async execute(interaction) {
        const player = getPlayer(interaction.client);
        const queue = player.getQueue(interaction.guildId);
        
        if (!queue?.playing) return await interaction.reply('Şu anda müzik çalmıyor!');
        
        const currentTrack = queue.current;
        const tracks = queue.tracks.slice(0, 10).map((m, i) => {
            return `${i + 1}. **${m.title}** ([Link](${m.url}))`;
        });

        await interaction.reply({
            embeds: [{
                title: 'Şarkı Sırası',
                description: `Şu anda çalıyor: **${currentTrack.title}**\n\n${tracks.join('\n')}`,
                color: 0xff0000
            }]
        });
    }
};
