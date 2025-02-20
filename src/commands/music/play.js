import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya YouTube linki')
                .setRequired(true)),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply('Önce bir ses kanalına katılmalısın!');
            }

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı');

            const searchResult = await player.search(query, {
                requestedBy: interaction.user
            });

            if (!searchResult.hasTracks()) {
                return await interaction.followUp('Şarkı bulunamadı!');
            }

            try {
                await player.play(interaction.member.voice.channel, searchResult.tracks[0], {
                    nodeOptions: {
                        metadata: interaction,
                        volume: 80,
                        leaveOnEmpty: true,
                        leaveOnEnd: true
                    }
                });

                return await interaction.followUp(`🎵 Çalınıyor: **${searchResult.tracks[0].title}**`);
            } catch (error) {
                console.error('Çalma hatası:', error);
                return await interaction.followUp('Şarkı çalınırken bir hata oluştu!');
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu!');
        }
    }
};