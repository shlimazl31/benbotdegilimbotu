import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Şarkıyı atlar'),

    async execute(interaction) {
        const player = getPlayer(interaction.client);
        const queue = player.getQueue(interaction.guildId);
        
        if (!queue?.playing) return await interaction.reply('Şu anda müzik çalmıyor!');
        
        queue.skip();
        await interaction.reply('⏭️ Şarkı atlandı!');
    }
};
