import { SlashCommandBuilder } from 'discord.js';
import { getPlayer, checkQueueState, updateQueueState, updateActivityTime, canAddToQueue } from '../../utils/player.js';
import { EmbedBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';

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
            // Kullanıcının ses kanalında olup olmadığını kontrol et
            const member = interaction.member;
            if (!member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Bu komutu kullanmak için bir ses kanalında olmalısın!')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Bot'un ses kanalına bağlanma izni var mı kontrol et
            const permissions = member.voice.channel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ İzin Hatası')
                    .setDescription('Ses kanalına bağlanmak için gerekli izinlere sahip değilim!')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Kuyruk durumunu kontrol et
            const queueState = checkQueueState(interaction.guild.id);
            if (queueState?.error) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şu anda bir hata durumu var. Lütfen biraz bekleyin veya `/stop` komutunu kullanın.')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Kuyruk boyutu kontrolü
            if (!canAddToQueue(interaction.guild.id)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Kuyruk Dolu')
                    .setDescription('Kuyruk maksimum boyuta ulaştı! (100 şarkı)')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Arama sorgusunu al
            const query = interaction.options.getString('query');

            // Yükleniyor mesajı
            const loadingEmbed = new EmbedBuilder()
                .setTitle('🔍 Aranıyor...')
                .setDescription(`**${query}** için arama yapılıyor...`)
                .setColor('#FFA500');
            await interaction.reply({ embeds: [loadingEmbed] });

            // Player'ı al
            const player = useMainPlayer();

            try {
                // Şarkıyı ara ve çal
                const { track } = await player.play(member.voice.channel, query, {
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            guildId: interaction.guild.id,
                            requestedBy: interaction.user
                        },
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000, // 5 dakika
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 300000, // 5 dakika
                        volume: 80,
                        bufferingTimeout: 3000,
                        selfDeaf: true
                    }
                });

                // Kuyruk durumunu güncelle
                updateQueueState(interaction.guild.id, {
                    isPlaying: true,
                    currentTrack: track,
                    queueSize: player.nodes.get(interaction.guild.id)?.tracks.size || 0,
                    lastUpdate: Date.now()
                });

                // Aktivite zamanını güncelle
                updateActivityTime(interaction.guild.id);

                // Başarılı mesajı
                const successEmbed = new EmbedBuilder()
                    .setTitle('✅ Şarkı Eklendi')
                    .setDescription(`**${track.title}** sıraya eklendi!`)
                    .addFields(
                        { name: '👤 Sanatçı', value: track.author, inline: true },
                        { name: '⏱️ Süre', value: track.duration, inline: true },
                        { name: '🔊 Ses', value: '80%', inline: true }
                    )
                    .setThumbnail(track.thumbnail)
                    .setColor('#00FF00')
                    .setFooter({ 
                        text: `${interaction.user.tag} tarafından istendi`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                await interaction.editReply({ embeds: [successEmbed] });

            } catch (error) {
                console.error('Şarkı çalma hatası:', error);

                // Hata mesajı
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şarkı çalınırken bir hata oluştu! Lütfen tekrar deneyin.')
                    .setColor('#FF0000');

                if (error.message.includes('No results found')) {
                    errorEmbed.setDescription('Aradığınız şarkı bulunamadı! Lütfen başka bir şarkı deneyin.');
                } else if (error.message.includes('Connection failed')) {
                    errorEmbed.setDescription('Ses kanalına bağlanırken bir hata oluştu! Lütfen tekrar deneyin.');
                }

                await interaction.editReply({ embeds: [errorEmbed] });

                // Kuyruk durumunu güncelle
                updateQueueState(interaction.guild.id, {
                    error: true,
                    errorMessage: error.message,
                    lastError: Date.now()
                });
            }

        } catch (error) {
            console.error('Play komutu hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Sistem Hatası')
                .setDescription('Bir hata oluştu! Lütfen daha sonra tekrar deneyin.')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};