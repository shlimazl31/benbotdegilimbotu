import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Şarkı sırasını gösterir'),

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

            // İlk mesajı gönder
            const message = await interaction.reply({ 
                content: '📋 Şarkı sırası yükleniyor...',
                fetchReply: true 
            });

            // Her 15 saniyede bir güncelle
            const updateInterval = setInterval(async () => {
                try {
                    // Eğer sıra yoksa veya çalma durduysa güncellemeyi durdur
                    if (!queue.isPlaying()) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const currentTrack = queue.currentTrack;
                    const tracks = queue.tracks.toArray();

                    // Toplam süreyi hesapla
                    const totalDuration = tracks.reduce((acc, track) => acc + track.durationMS, currentTrack.durationMS);
                    const formatDuration = (ms) => {
                        const seconds = Math.floor(ms / 1000);
                        const minutes = Math.floor(seconds / 60);
                        const hours = Math.floor(minutes / 60);
                        return hours > 0 
                            ? `${hours}:${minutes % 60}:${seconds % 60}`
                            : `${minutes}:${seconds % 60}`;
                    };

                    // Şu an çalan şarkının ilerleme çubuğu
                    const progress = queue.node.createProgressBar();
                    const timestamp = queue.node.getTimestamp();
                    const progressBar = progress
                        .replace('─', '▬')
                        .replace('●', '🔘')
                        .replace('○', '▬');

                    let description = `**Şu An Çalıyor:**\n🎵 ${currentTrack.title} - ${currentTrack.author}\n${progressBar}\n\n`;

                    if (tracks.length === 0) {
                        description += '*Sırada başka şarkı yok*';
                    } else {
                        description += `**Sıradaki Şarkılar:**\n`;
                        const trackList = tracks
                            .slice(0, 10)
                            .map((track, i) => `${i + 1}. ${track.title} - ${track.author}`)
                            .join('\n');
                        
                        description += trackList;
                        
                        if (tracks.length > 10) {
                            description += `\n\n*ve ${tracks.length - 10} şarkı daha...*`;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('📋 Şarkı Sırası')
                        .setDescription(description)
                        .addFields(
                            { name: '⏱️ Toplam Süre', value: formatDuration(totalDuration), inline: true },
                            { name: '🎵 Toplam Şarkı', value: `${tracks.length + 1}`, inline: true },
                            { name: '🔄 Tekrar Modu', value: queue.repeatMode ? 'Açık' : 'Kapalı', inline: true }
                        )
                        .setColor('#FF0000')
                        .setFooter({ 
                            text: `Sayfa 1/1 • ${interaction.guild.name} • Otomatik güncelleniyor...`,
                            iconURL: interaction.guild.iconURL()
                        });

                    await message.edit({ embeds: [embed] });
                } catch (error) {
                    console.error('Queue güncelleme hatası:', error);
                    clearInterval(updateInterval);
                }
            }, 15000); // 15 saniyede bir güncelle

            // 5 dakika sonra güncellemeyi durdur
            setTimeout(() => {
                clearInterval(updateInterval);
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('Queue hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};
