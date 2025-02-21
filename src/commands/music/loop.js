import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { QueueRepeatMode } from 'discord-player';

export const command = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Tekrar modunu ayarlar')
        .addStringOption(option =>
            option.setName('mod')
                .setDescription('Tekrar modu')
                .setRequired(true)
                .addChoices(
                    { name: 'Kapalı', value: 'off' },
                    { name: 'Şarkı', value: 'track' },
                    { name: 'Sıra', value: 'queue' }
                )),

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

            const loopMode = interaction.options.getString('mod');
            let mode;

            switch (loopMode) {
                case 'off':
                    mode = QueueRepeatMode.OFF;
                    await interaction.reply('➡️ Tekrar modu kapatıldı');
                    break;
                case 'track':
                    mode = QueueRepeatMode.TRACK;
                    await interaction.reply('🔂 Şarkı tekrar modu açıldı');
                    break;
                case 'queue':
                    mode = QueueRepeatMode.QUEUE;
                    await interaction.reply('🔁 Sıra tekrar modu açıldı');
                    break;
            }

            queue.setRepeatMode(mode);
        } catch (error) {
            console.error('Loop hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 