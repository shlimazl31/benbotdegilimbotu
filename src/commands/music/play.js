import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import playdl from 'play-dl';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Bir şarkı çalar')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Şarkı adı veya URL')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const query = interaction.options.getString('query');
            const member = interaction.member;
            const channel = member.voice.channel;

            if (!channel) {
                return await interaction.editReply('❌ Bir ses kanalında olmalısın!');
            }

            const permissions = channel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return await interaction.editReply('❌ Ses kanalına bağlanma veya konuşma iznim yok!');
            }

            const player = useMainPlayer();
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: 'youtube',
                fallbackSearchEngine: 'youtube'
            });

            if (!searchResult.hasTracks()) {
                return await interaction.editReply('❌ Şarkı bulunamadı!');
            }

            try {
                const { track } = await player.play(channel, searchResult, {
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild.members.me,
                            requestedBy: interaction.user
                        },
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 300000,
                        volume: 80
                    }
                });

                return await interaction.editReply(`🎵 **${track.title}** şarkısı çalınıyor!`);
            } catch (error) {
                console.error('Oynatma hatası:', error);
                return await interaction.editReply('❌ Şarkı çalınırken bir hata oluştu!');
            }
        } catch (error) {
            console.error('Play komutu hatası:', error);
            return await interaction.editReply('❌ Bir hata oluştu!');
        }
    }
};