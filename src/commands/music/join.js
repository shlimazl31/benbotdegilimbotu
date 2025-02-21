import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Ses kanalına katılır'),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (queue) {
                return await interaction.reply({
                    content: '❌ Zaten bir ses kanalındayım!',
                    ephemeral: true
                });
            }

            await player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
                },
                selfDeaf: true,
                volume: 80,
                leaveOnEmpty: false,
                leaveOnEmptyCooldown: 300000,
                leaveOnEnd: false,
                leaveOnEndCooldown: 300000,
            });

            return await interaction.reply('👋 Ses kanalına katıldım!');
        } catch (error) {
            console.error('Join komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 