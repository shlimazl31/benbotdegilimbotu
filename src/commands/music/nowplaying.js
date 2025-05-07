import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

// Kullanıcıların son nowplaying mesajlarını tutacak Map
const lastNowPlayingMessages = new Map();

export const command = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Şu an çalan şarkının bilgilerini gösterir'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            // Kullanıcının önceki mesajını sil
            const lastMessage = lastNowPlayingMessages.get(interaction.user.id);
            if (lastMessage) {
                try {
                    await lastMessage.delete().catch(() => {});
                } catch (error) {
                    console.error('Önceki mesaj silinirken hata:', error);
                }
            }

            const track = queue.currentTrack;
            
            // Butonları oluştur
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setLabel(queue.node.isPaused() ? '▶️ Devam Et' : '⏸️ Duraklat')
                        .setStyle(queue.node.isPaused() ? ButtonStyle.Success : ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('skip')
                        .setLabel('⏭️ Atla')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('loop')
                        .setLabel(queue.repeatMode ? '🔁 Tekrar: Açık' : '🔁 Tekrar: Kapalı')
                        .setStyle(queue.repeatMode ? ButtonStyle.Success : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('shuffle')
                        .setLabel('🔀 Karıştır')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('⏹️ Durdur')
                        .setStyle(ButtonStyle.Danger)
                );

            // İlk mesajı gönder
            const message = await interaction.reply({ 
                fetchReply: true 
            });

            // Mesajı Map'e kaydet
            lastNowPlayingMessages.set(interaction.user.id, message);

            // Buton etkileşimlerini dinle
            const collector = message.createMessageComponentCollector({ 
                time: 15 * 60 * 1000 // 15 dakika
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ 
                        content: '❌ Bu butonları sadece komutu kullanan kişi kullanabilir!', 
                        ephemeral: true 
                    });
                }

                switch (i.customId) {
                    case 'pause':
                        if (queue.node.isPaused()) {
                            queue.node.resume();
                            await i.reply({ content: '▶️ Şarkı devam ediyor!', ephemeral: true });
                        } else {
                            queue.node.pause();
                            await i.reply({ content: '⏸️ Şarkı duraklatıldı!', ephemeral: true });
                        }
                        break;
                    case 'skip':
                        queue.node.skip();
                        await i.reply({ content: '⏭️ Şarkı atlandı!', ephemeral: true });
                        break;
                    case 'loop':
                        queue.setRepeatMode(queue.repeatMode === 0 ? 2 : 0);
                        await i.reply({ 
                            content: queue.repeatMode ? '🔁 Tekrar modu açıldı!' : '🔁 Tekrar modu kapatıldı!', 
                            ephemeral: true 
                        });
                        break;
                    case 'shuffle':
                        queue.tracks.shuffle();
                        await i.reply({ content: '🔀 Sıra karıştırıldı!', ephemeral: true });
                        break;
                    case 'stop':
                        queue.delete();
                        await i.reply({ content: '⏹️ Müzik durduruldu!', ephemeral: true });
                        break;
                }
            });

            // Her 10 saniyede bir güncelle
            const updateInterval = setInterval(async () => {
                try {
                    // Eğer şarkı değiştiyse veya durduysa güncellemeyi durdur
                    if (!queue.isPlaying() || queue.currentTrack.id !== track.id) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const progress = queue.node.createProgressBar();
                    const timestamp = queue.node.getTimestamp();

                    // İlerleme çubuğu için özel emoji'ler
                    const progressBar = progress
                        .replace('─', '▬')
                        .replace('●', '🔘')
                        .replace('○', '▬');

                    // Şarkı türüne göre renk belirle
                    let color = '#FF0000'; // Varsayılan renk
                    const title = track.title.toLowerCase();
                    if (title.includes('pop')) color = '#FF69B4'; // Pembe
                    else if (title.includes('rock')) color = '#FF0000'; // Kırmızı
                    else if (title.includes('rap') || title.includes('hip hop')) color = '#000000'; // Siyah
                    else if (title.includes('classic') || title.includes('klasik')) color = '#FFD700'; // Altın
                    else if (title.includes('jazz')) color = '#8B4513'; // Kahverengi
                    else if (title.includes('electronic') || title.includes('edm')) color = '#00FFFF'; // Cyan

                    // Süre formatını düzelt
                    const formatDuration = (duration) => {
                        if (!duration) return '00:00';
                        const minutes = Math.floor(duration / 60);
                        const seconds = Math.floor(duration % 60);
                        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    };

                    const embed = new EmbedBuilder()
                        .setTitle('🎵 Şu An Çalıyor')
                        .setDescription(`**${track.title}**\n${progressBar}`)
                        .addFields(
                            { name: '👤 Sanatçı', value: track.author, inline: true },
                            { name: '⏱️ Süre', value: `${formatDuration(timestamp.current)} / ${formatDuration(timestamp.total)}`, inline: true },
                            { name: '🔊 Ses Seviyesi', value: `${queue.node.volume}%`, inline: true },
                            { name: '📊 Sıra Pozisyonu', value: `${queue.tracks.size + 1} şarkı`, inline: true },
                            { name: '🔄 Tekrar Modu', value: queue.repeatMode ? 'Açık' : 'Kapalı', inline: true }
                        )
                        .setThumbnail(track.thumbnail)
                        .setColor(color)
                        .setFooter({ 
                            text: `İsteyen: ${track.requestedBy.tag} • Otomatik güncelleniyor...`,
                            iconURL: track.requestedBy.displayAvatarURL()
                        });

                    // Butonları güncelle
                    buttons.components[0].setLabel(queue.node.isPaused() ? '▶️ Devam Et' : '⏸️ Duraklat')
                        .setStyle(queue.node.isPaused() ? ButtonStyle.Success : ButtonStyle.Primary);
                    buttons.components[2].setLabel(queue.repeatMode ? '🔁 Tekrar: Açık' : '🔁 Tekrar: Kapalı')
                        .setStyle(queue.repeatMode ? ButtonStyle.Success : ButtonStyle.Secondary);

                    await message.edit({ embeds: [embed], components: [buttons] });
                } catch (error) {
                    console.error('Nowplaying güncelleme hatası:', error);
                    clearInterval(updateInterval);
                }
            }, 10000);

            // 15 dakika sonra güncellemeyi durdur
            setTimeout(() => {
                clearInterval(updateInterval);
                message.edit({ components: [] }).catch(() => {}); // Butonları kaldır
                lastNowPlayingMessages.delete(interaction.user.id); // Map'ten mesajı sil
            }, 15 * 60 * 1000);

        } catch (error) {
            console.error('Nowplaying hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 