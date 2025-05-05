import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildVolume } from '../../utils/settings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya link')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const channel = interaction.member.voice.channel;
            if (!channel) {
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı', true);

            try {
                const searchResult = await player.search(query);
                
                if (!searchResult.hasTracks()) {
                    return await interaction.followUp({
                        content: '❌ Şarkı bulunamadı!',
                        ephemeral: true
                    });
                }

                const { track } = await player.play(channel, searchResult, {
                    nodeOptions: {
                        metadata: interaction.channel,
                        volume: getGuildVolume(interaction.guildId),
                        bufferingTimeout: 3000,
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        leaveOnStop: false,
                        selfDeaf: true,
                        skipFFmpeg: false
                    }
                });

                return await interaction.followUp(`🎵 **${track.title}** sıraya eklendi!`);
            } catch (error) {
                console.error('Çalma hatası:', error);
                return await interaction.followUp({
                    content: `❌ Bir hata oluştu: ${error.message}`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};