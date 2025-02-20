import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { QueryType } from 'discord-player';

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

            const result = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            });

            if (!result.hasTracks()) {
                return await interaction.followUp('Şarkı bulunamadı!');
            }

            try {
                const res = await player.play(
                    interaction.member.voice.channel,
                    result.tracks[0],
                    {
                        nodeOptions: {
                            metadata: {
                                channel: interaction.channel,
                                client: interaction.guild.members.me,
                                requestedBy: interaction.user
                            },
                            volume: 80,
                            leaveOnEmpty: true,
                            leaveOnEmptyCooldown: 300000,
                            leaveOnEnd: true,
                            leaveOnEndCooldown: 300000,
                        }
                    }
                );

                return await interaction.followUp(`🎵 **${result.tracks[0].title}** sıraya eklendi!`);
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