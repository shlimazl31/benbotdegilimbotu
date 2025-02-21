import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Sıradaki bir şarkıyı başka bir pozisyona taşır')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('Taşınacak şarkının sıra numarası')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('Şarkının taşınacağı sıra numarası')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.tracks.size) {
                return await interaction.reply({
                    content: '❌ Sırada şarkı yok!',
                    ephemeral: true
                });
            }

            const from = interaction.options.getInteger('from') - 1;
            const to = interaction.options.getInteger('to') - 1;

            if (from < 0 || from >= queue.tracks.size || to < 0 || to >= queue.tracks.size) {
                return await interaction.reply({
                    content: '❌ Geçersiz sıra numarası!',
                    ephemeral: true
                });
            }

            const track = queue.tracks.at(from);
            queue.tracks.splice(from, 1);
            queue.tracks.splice(to, 0, track);

            return await interaction.reply(`✅ **${track.title}** ${from + 1}. sıradan ${to + 1}. sıraya taşındı!`);
        } catch (error) {
            console.error('Move komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 