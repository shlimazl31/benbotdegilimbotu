import { SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { Client } from 'genius-lyrics';

export const command = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Şarkı sözlerini gösterir')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Şarkı adı (boş bırakılırsa çalan şarkının sözleri gösterilir)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Yükleniyor mesajı
            const loadingEmbed = new EmbedBuilder()
                .setTitle('🔍 Aranıyor...')
                .setDescription('Şarkı sözleri aranıyor...')
                .setColor('#FFA500');
            await interaction.reply({ embeds: [loadingEmbed] });

            // Genius client'ı oluştur
            const genius = new Client({
                clientId: process.env.GENIUS_CLIENT_ID,
                clientSecret: process.env.GENIUS_CLIENT_SECRET
            });

            // Şarkı adını al
            let query = interaction.options.getString('query');

            // Eğer query belirtilmemişse, çalan şarkıyı kullan
            if (!query) {
                const player = useMainPlayer();
                const queue = player.nodes.get(interaction.guild.id);

                if (!queue || !queue.isPlaying()) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription('Şu anda çalan bir şarkı yok! Lütfen bir şarkı adı belirtin.')
                        .setColor('#FF0000');
                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                query = `${queue.currentTrack.title} ${queue.currentTrack.author}`;
            }

            try {
                // Şarkıyı ara
                const searches = await genius.songs.search(query);
                if (!searches.length) {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription('Şarkı sözleri bulunamadı!')
                        .setColor('#FF0000');
                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                // İlk sonucu al
                const song = searches[0];
                
                // Şarkı sözlerini al
                const lyrics = await song.lyrics();
                
                // Sözleri parçalara böl (Discord'un 4096 karakter sınırı için)
                const chunks = splitLyrics(lyrics);
                
                // İlk embed'i gönder
                const firstEmbed = new EmbedBuilder()
                    .setTitle(`📜 ${song.title}`)
                    .setDescription(chunks[0])
                    .setColor('#00FF00')
                    .setThumbnail(song.thumbnail)
                    .setFooter({ 
                        text: `Sanatçı: ${song.artist.name} | Sayfa 1/${chunks.length}`,
                        iconURL: song.artist.image
                    });

                const message = await interaction.editReply({ embeds: [firstEmbed] });

                // Eğer birden fazla sayfa varsa, butonları ekle
                if (chunks.length > 1) {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('◀️ Önceki')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Sonraki ▶️')
                                .setStyle(ButtonStyle.Primary)
                        );

                    await message.edit({ components: [row] });

                    // Buton etkileşimlerini dinle
                    const collector = message.createMessageComponentCollector({ 
                        time: 300000 // 5 dakika
                    });

                    let currentPage = 0;

                    collector.on('collect', async (i) => {
                        if (i.user.id !== interaction.user.id) {
                            return i.reply({ 
                                content: '❌ Bu butonları sadece komutu kullanan kişi kullanabilir!', 
                                ephemeral: true 
                            });
                        }

                        try {
                            if (i.customId === 'prev') {
                                currentPage--;
                            } else if (i.customId === 'next') {
                                currentPage++;
                            }

                            const embed = new EmbedBuilder()
                                .setTitle(`📜 ${song.title}`)
                                .setDescription(chunks[currentPage])
                                .setColor('#00FF00')
                                .setThumbnail(song.thumbnail)
                                .setFooter({ 
                                    text: `Sanatçı: ${song.artist.name} | Sayfa ${currentPage + 1}/${chunks.length}`,
                                    iconURL: song.artist.image
                                });

                            const newRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('prev')
                                        .setLabel('◀️ Önceki')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(currentPage === 0),
                                    new ButtonBuilder()
                                        .setCustomId('next')
                                        .setLabel('Sonraki ▶️')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(currentPage === chunks.length - 1)
                                );

                            await i.update({ embeds: [embed], components: [newRow] });
                        } catch (error) {
                            console.error('Buton etkileşimi hatası:', error);
                            await i.reply({ 
                                content: '❌ Bir hata oluştu!', 
                                ephemeral: true 
                            });
                        }
                    });

                    collector.on('end', () => {
                        // Butonları devre dışı bırak
                        const disabledRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('prev')
                                    .setLabel('◀️ Önceki')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('Sonraki ▶️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true)
                            );

                        message.edit({ components: [disabledRow] }).catch(console.error);
                    });
                }

            } catch (error) {
                console.error('Lyrics arama hatası:', error);
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şarkı sözleri alınırken bir hata oluştu!')
                    .setColor('#FF0000');
                await interaction.editReply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error('Lyrics komutu hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Sistem Hatası')
                .setDescription('Bir hata oluştu! Lütfen daha sonra tekrar deneyin.')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

// Yardımcı fonksiyonlar
function splitLyrics(lyrics) {
    const chunks = [];
    const maxLength = 4000; // Discord'un 4096 karakter sınırı için güvenli bir değer

    while (lyrics.length > 0) {
        if (lyrics.length <= maxLength) {
            chunks.push(lyrics);
            break;
        }

        let splitIndex = lyrics.lastIndexOf('\n', maxLength);
        if (splitIndex === -1) {
            splitIndex = maxLength;
        }

        chunks.push(lyrics.substring(0, splitIndex));
        lyrics = lyrics.substring(splitIndex + 1);
    }

    return chunks;
} 