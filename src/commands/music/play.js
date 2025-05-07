import { SlashCommandBuilder } from 'discord.js';
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
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            // DJ rolü kontrolü
            if (!hasDjRole(interaction.member)) {
                return await interaction.reply({
                    content: '❌ Bu komutu kullanmak için DJ rolüne sahip olmalısın!',
                    ephemeral: true
                });
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
                    return await interaction.followUp({
                        content: '❌ Şarkı bulunamadı!',
                        ephemeral: true
                    }).catch(e => console.error("followUp hatası:", e));
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
                    return await interaction.followUp(`🎵 **${track.title}** sıraya eklendi!`)
                        .catch(e => console.error("followUp hatası:", e));
                        
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
                            return await interaction.followUp(`🎵 **${track.title}** sıraya eklendi!`)
                                .catch(e => console.error("followUp hatası:", e));
                        } catch (alternativeError) {
                            console.error('Alternatif şarkı çalma hatası:', alternativeError);
                        }
                    }
                    
                    return await interaction.followUp({
                        content: `❌ Şarkı çalınırken bir hata oluştu. Lütfen başka bir şarkı deneyin.`,
                        ephemeral: true
                    }).catch(e => console.error("followUp hatası:", e));
                }
            } catch (error) {
                console.error('Play komutu hatası:', error);
                await interaction.followUp({
                    content: '❌ Bir hata oluştu!',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Play komutu hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};