import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildVolume } from '../../utils/settings.js';
import { hasDjRole } from './dj.js';
import play from 'play-dl';

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
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // DJ rolü kontrolü
            if (!hasDjRole(interaction.member)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Yetki Gerekli')
                    .setDescription('Bu komutu kullanmak için DJ rolüne sahip olmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await interaction.deferReply().catch(e => console.error("deferReply hatası:", e));

            try {
                const player = await getPlayer(interaction.client);
                const query = interaction.options.getString('şarkı', true);

                console.log(`🔍 "${query}" için arama yapılıyor...`);
                
                let searchResult;
                let youtubeUrl = null;
                
                // YouTube URL kontrolü
                const isYoutubeUrl = play.yt_validate(query) === 'video';
                
                if (isYoutubeUrl) {
                    console.log("YouTube URL'si tespit edildi, işleniyor...");
                    youtubeUrl = query;
                } else {
                    // URL değilse, play-dl ile arama yap
                    try {
                        console.log("URL değil, play-dl ile arama yapılıyor...");
                        const searchResults = await play.search(query, { limit: 1 });
                        if (searchResults && searchResults.length > 0) {
                            youtubeUrl = searchResults[0].url;
                            console.log(`✅ play-dl ile şarkı bulundu: ${searchResults[0].title}`);
                        } else {
                            console.log("⚠️ play-dl ile sonuç bulunamadı, normal arama deneniyor...");
                        }
                    } catch (playDlError) {
                        console.error("play-dl arama hatası:", playDlError);
                    }
                }
                
                // YouTube URL veya play-dl sonucu varsa, discord-player'a gönder
                if (youtubeUrl) {
                    searchResult = await player.search(youtubeUrl, {
                        requestedBy: interaction.user
                    });
                } else {
                    // Diğer durumda normal Discord Player araması yap
                    searchResult = await player.search(query, {
                        requestedBy: interaction.user
                    });
                }
                
                if (!searchResult || !searchResult.hasTracks()) {
                    console.log(`❌ "${query}" için şarkı bulunamadı`);
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Şarkı Bulunamadı')
                        .setDescription('Aradığın şarkı bulunamadı!')
                        .setColor('#FF0000');
                    return await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(e => console.error("followUp hatası:", e));
                }

                console.log(`✅ "${query}" için ${searchResult.tracks.length} şarkı bulundu`);
                
                try {
                    const volume = getGuildVolume(interaction.guildId) || 70;
                    
                    // GuildQueue oluştur ve track ekle
                    const { track } = await player.play(channel, searchResult.tracks[0], {
                        nodeOptions: {
                            metadata: interaction.channel,
                            volume: volume,
                            selfDeaf: true,
                            // Bot kanalda kalsın için connection options
                            leaveOnEmpty: false,
                            leaveOnEnd: false,
                            leaveOnStop: false
                        }
                    });

                    console.log(`✅ "${track.title}" sıraya eklendi`);
                    const embed = new EmbedBuilder()
                        .setTitle('🎵 Sıraya Eklendi')
                        .setDescription(`**${track.title}** sıraya eklendi!`)
                        .setThumbnail(track.thumbnail)
                        .setColor('#00C851');
                    return await interaction.followUp({ embeds: [embed] }).catch(e => console.error("followUp hatası:", e));
                        
                } catch (playError) {
                    console.error('Şarkı çalma hatası:', playError);
                    
                    // İlk track başarısız olursa ve alternatif varsa, onu dene
                    if (searchResult.tracks.length > 1) {
                        try {
                            console.log(`İlk şarkı çalınamadı, sıradaki şarkı deneniyor...`);
                            const { track } = await player.play(channel, searchResult.tracks[1], {
                                nodeOptions: {
                                    metadata: interaction.channel,
                                    volume: getGuildVolume(interaction.guildId) || 70,
                                    selfDeaf: true,
                                    // Bot kanalda kalsın için connection options
                                    leaveOnEmpty: false,
                                    leaveOnEnd: false,
                                    leaveOnStop: false
                                }
                            });
                            
                            console.log(`✅ "${track.title}" sıraya eklendi (alternatif)`);
                            const embed = new EmbedBuilder()
                                .setTitle('🎵 Sıraya Eklendi (Alternatif)')
                                .setDescription(`**${track.title}** sıraya eklendi!`)
                                .setThumbnail(track.thumbnail)
                                .setColor('#00C851');
                            return await interaction.followUp({ embeds: [embed] }).catch(e => console.error("followUp hatası:", e));
                        } catch (alternativeError) {
                            console.error('Alternatif şarkı çalma hatası:', alternativeError);
                        }
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Şarkı Çalınamadı')
                        .setDescription('Şarkı çalınırken bir hata oluştu. Lütfen başka bir şarkı deneyin.')
                        .setColor('#FF0000');
                    return await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(e => console.error("followUp hatası:", e));
                }
            } catch (error) {
                console.error('Play komutu hatası:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Bir hata oluştu!')
                    .setColor('#FF0000');
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error('Play komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};