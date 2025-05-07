import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya URL')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Interaction'ı ertele
            await interaction.deferReply();

            // Ses kanalı kontrolü
            const voiceChannel = interaction.member?.voice?.channel;
            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [embed] });
            }

            // Bot yetkilerini kontrol et
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has(['Connect', 'Speak'])) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Yetersiz Yetkiler')
                    .setDescription('Ses kanalına katılmak ve konuşmak için yetkim yok!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [embed] });
            }

            try {
                const query = interaction.options.getString('şarkı', true);
                const player = await getPlayer(interaction.client);

                // Queue oluştur veya al
                let queue = player.nodes.get(interaction.guildId);
                if (!queue) {
                    queue = player.nodes.create(interaction.guildId, {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.client,
                            requestedBy: interaction.user,
                        },
                        selfDeaf: true,
                        volume: 80,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000, // 5 dakika
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 300000, // 5 dakika
                    });
                }

                try {
                    if (!queue.connection) {
                        await queue.connect(voiceChannel);
                    }
                } catch (error) {
                    console.error('🔴 Ses kanalına bağlanma hatası:', error);
                    queue.delete();
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Bağlantı Hatası')
                        .setDescription('Ses kanalına bağlanırken bir hata oluştu!')
                        .setColor('#FF0000');
                    return await interaction.editReply({ embeds: [embed] });
                }

                // Şarkı ara ve kuyruğa ekle
                const searchResult = await player.search(query, {
                    requestedBy: interaction.user
                });

                if (!searchResult.hasTracks()) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Şarkı Bulunamadı')
                        .setDescription(`"${query}" için sonuç bulunamadı!`)
                        .setColor('#FF0000');
                    return await interaction.editReply({ embeds: [embed] });
                }

                try {
                    searchResult.playlist
                        ? queue.addTrack(searchResult.tracks)
                        : queue.addTrack(searchResult.tracks[0]);

                    if (!queue.isPlaying()) {
                        await queue.node.play();
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(searchResult.playlist ? '📜 Playlist Eklendi' : '🎵 Şarkı Eklendi')
                        .setDescription(
                            searchResult.playlist
                                ? `**${searchResult.playlist.title}** playlistinden ${searchResult.tracks.length} şarkı eklendi!`
                                : `**${searchResult.tracks[0].title}** sıraya eklendi!`
                        )
                        .setColor('#00FF00')
                        .setThumbnail(searchResult.playlist?.thumbnail || searchResult.tracks[0].thumbnail)
                        .addFields(
                            { name: '⏱️ Süre', value: searchResult.playlist 
                                ? `Toplam ${Math.round(searchResult.tracks.reduce((acc, track) => acc + track.durationMS, 0) / 1000 / 60)} dakika`
                                : searchResult.tracks[0].duration
                            },
                            { name: '👤 Ekleyen', value: interaction.user.tag }
                        );
                    
                    return await interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('🔴 Şarkı ekleme hatası:', error);
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Oynatma Hatası')
                        .setDescription('Şarkı eklenirken bir hata oluştu!')
                        .setColor('#FF0000');
                    return await interaction.editReply({ embeds: [embed] });
                }
            } catch (error) {
                console.error('🔴 Arama hatası:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Arama Hatası')
                    .setDescription('Şarkı aranırken bir hata oluştu!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('🔴 Genel hata:', error);
            if (interaction.deferred) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Beklenmeyen bir hata oluştu!')
                    .setColor('#FF0000');
                await interaction.editReply({ embeds: [embed] }).catch(console.error);
            }
        }
    }
};