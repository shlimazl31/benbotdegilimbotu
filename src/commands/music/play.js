import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import playdl from 'play-dl';
import fs from 'fs';

// YouTube kimlik doğrulaması
async function setupYouTubeAuth() {
    try {
        const cookiePath = './www.youtube.com_cookies.txt';
        if (fs.existsSync(cookiePath)) {
            await playdl.setCookie(cookiePath);
            console.log('YouTube kimlik doğrulaması başarıyla yapılandırıldı');
        } else {
            console.warn('YouTube çerez dosyası bulunamadı!');
        }
    } catch (error) {
        console.error('YouTube kimlik doğrulaması yapılandırılırken hata:', error);
    }
}

// YouTube kimlik doğrulamasını başlat
setupYouTubeAuth();

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Bir şarkı çalar')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Şarkı adı veya URL')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

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
            
            // Player event listener'larını ayarla
            player.events.on('error', (queue, error) => {
                console.error(`Player error: ${error.message}`);
                queue.metadata.channel.send(`❌ Bir hata oluştu: ${error.message}`).catch(console.error);
            });

            player.events.on('playerError', (queue, error) => {
                console.error(`Player error: ${error.message}`);
                queue.metadata.channel.send(`❌ Bir hata oluştu: ${error.message}`).catch(console.error);
            });

            player.events.on('connectionError', (queue, error) => {
                console.error(`Connection error: ${error.message}`);
                queue.metadata.channel.send(`❌ Bağlantı hatası: ${error.message}`).catch(console.error);
            });

            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: 'youtube',
                fallbackSearchEngine: 'youtube'
            });

            if (!searchResult.hasTracks()) {
                return await interaction.editReply('❌ Şarkı bulunamadı!');
            }

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
                    connectionTimeout: 30000,
                    selfDeaf: true,
                    bufferingTimeout: 3000,
                    retry: {
                        maxRetries: 3,
                        retryInterval: 5000
                    }
                }
            });

            return await interaction.editReply(`🎵 **${track.title}** şarkısı çalınıyor!`);
        } catch (error) {
            console.error('Play komutu hatası:', error);
            
            if (interaction.deferred || interaction.replied) {
                try {
                    if (error.message.includes('Sign in to confirm you\'re not a bot')) {
                        return await interaction.editReply('❌ YouTube kimlik doğrulaması gerekiyor. Lütfen YouTube çerezlerini ayarlayın.');
                    }
                    if (error.message.includes('Cannot perform IP discovery')) {
                        return await interaction.editReply('❌ Ses bağlantısı kurulamadı. Lütfen tekrar deneyin.');
                    }
                    return await interaction.editReply(`❌ Şarkı çalınırken bir hata oluştu: ${error.message}`);
                } catch (replyError) {
                    console.error('Hata mesajı gönderilemedi:', replyError);
                }
            } else {
                try {
                    await interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
                } catch (replyError) {
                    console.error('Hata mesajı gönderilemedi:', replyError);
                }
            }
        }
    }
};