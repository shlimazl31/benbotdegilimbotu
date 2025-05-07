import { SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { checkQueueState, updateQueueState } from '../../utils/player.js';

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
            if (!interaction.member.voice.channel) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Bir ses kanalında olmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Bot'un ses kanalına katılma izni olup olmadığını kontrol et
            const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Ses kanalına katılmak ve konuşmak için izinlerim yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Yükleniyor mesajı
            const loadingEmbed = new EmbedBuilder()
                .setTitle('🔍 Aranıyor...')
                .setDescription('Şarkı aranıyor...')
                .setColor('#FFA500');
            await interaction.reply({ embeds: [loadingEmbed] });

            const query = interaction.options.getString('query');
            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guild.id);

            // Kuyruk durumunu kontrol et
            const queueState = checkQueueState(interaction.guild.id);
            if (queueState && queueState.isFull) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Kuyruk dolu! Lütfen daha sonra tekrar deneyin.')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            try {
                // Şarkıyı çal
                const { track } = await player.play(
                    interaction.member.voice.channel,
                    query,
                    {
                        nodeOptions: {
                            metadata: {
                                channel: interaction.channel,
                                guildId: interaction.guild.id,
                                requestedBy: interaction.user
                            },
                            leaveOnEmpty: true,
                            leaveOnEnd: true,
                            leaveOnStop: true,
                            leaveOnEmptyCooldown: 300000, // 5 dakika
                            leaveOnEndCooldown: 300000, // 5 dakika
                            leaveOnStopCooldown: 300000, // 5 dakika
                            volume: 80,
                            maxSize: 100
                        }
                    }
                );

                // Kuyruk durumunu güncelle
                updateQueueState(interaction.guild.id, {
                    isPlaying: true,
                    currentTrack: track,
                    lastActivity: Date.now()
                });

                // Başarılı mesajı
                const successEmbed = new EmbedBuilder()
                    .setTitle('🎵 Şarkı Eklendi')
                    .setDescription(`**${track.title}** kuyruğa eklendi!`)
                    .setColor('#00FF00')
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        { name: '🎤 Sanatçı', value: track.author, inline: true },
                        { name: '⏱️ Süre', value: track.duration, inline: true },
                        { name: '🔊 Ses Seviyesi', value: '80%', inline: true }
                    )
                    .setFooter({ text: `İsteyen: ${interaction.user.tag}` });

                await interaction.editReply({ embeds: [successEmbed] });

            } catch (error) {
                console.error('Şarkı çalma hatası:', error);
                
                // Kuyruk durumunu güncelle
                updateQueueState(interaction.guild.id, {
                    isPlaying: false,
                    error: error.message
                });

                let errorMessage = 'Şarkı çalınırken bir hata oluştu!';
                
                if (error.message.includes('No results found')) {
                    errorMessage = 'Şarkı bulunamadı!';
                } else if (error.message.includes('Could not connect')) {
                    errorMessage = 'Ses kanalına bağlanılamadı!';
                }

                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription(errorMessage)
                    .setColor('#FF0000');
                
                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error('Play komutu hatası:', error);
            
            // Eğer etkileşim henüz yanıtlanmamışsa
            if (!interaction.replied && !interaction.deferred) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Sistem Hatası')
                    .setDescription('Bir hata oluştu! Lütfen daha sonra tekrar deneyin.')
                    .setColor('#FF0000');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                // Etkileşim zaten yanıtlanmışsa, mesajı düzenle
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Sistem Hatası')
                    .setDescription('Bir hata oluştu! Lütfen daha sonra tekrar deneyin.')
                    .setColor('#FF0000');
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    }
};