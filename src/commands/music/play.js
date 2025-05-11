import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import playdl from 'play-dl';

// Set up YouTube authentication
playdl.setToken({
    youtube: {
        cookie: process.env.YOUTUBE_COOKIE
    }
});

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
            
            // Set up error handling for the player
            player.events.on('error', (queue, error) => {
                console.error(`Player error: ${error.message}`);
                queue.metadata.channel.send(`❌ Bir hata oluştu: ${error.message}`);
            });

            player.events.on('playerError', (queue, error) => {
                console.error(`Player error: ${error.message}`);
                queue.metadata.channel.send(`❌ Bir hata oluştu: ${error.message}`);
            });

            // Set up connection error handling
            player.events.on('connectionError', (queue, error) => {
                console.error(`Connection error: ${error.message}`);
                queue.metadata.channel.send(`❌ Bağlantı hatası: ${error.message}`);
            });

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
                        volume: 80,
                        // Add connection options
                        connectionTimeout: 30000,
                        selfDeaf: true,
                        bufferingTimeout: 3000,
                        // Add retry options
                        retry: {
                            maxRetries: 3,
                            retryInterval: 5000
                        }
                    }
                });

                return await interaction.editReply(`🎵 **${track.title}** şarkısı çalınıyor!`);
            } catch (error) {
                console.error('Oynatma hatası:', error);
                if (error.message.includes('Sign in to confirm you\'re not a bot')) {
                    return await interaction.editReply('❌ YouTube kimlik doğrulaması gerekiyor. Lütfen YouTube çerezlerini ayarlayın.');
                }
                if (error.message.includes('Cannot perform IP discovery')) {
                    return await interaction.editReply('❌ Ses bağlantısı kurulamadı. Lütfen tekrar deneyin.');
                }
                return await interaction.editReply(`❌ Şarkı çalınırken bir hata oluştu: ${error.message}`);
            }
        } catch (error) {
            console.error('Play komutu hatası:', error);
            return await interaction.editReply(`❌ Bir hata oluştu: ${error.message}`);
        }
    }
};