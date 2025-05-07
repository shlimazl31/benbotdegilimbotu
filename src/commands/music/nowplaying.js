import { SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { checkQueueState, setLastNowPlayingMessage, clearLastNowPlayingMessage } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Şu anda çalan şarkıyı gösterir'),

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

            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guild.id);

            // Çalan şarkı var mı kontrol et
            if (!queue || !queue.isPlaying()) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            // Önceki now playing mesajını temizle
            await clearLastNowPlayingMessage(interaction.guild.id);

            const track = queue.currentTrack;
            const progress = queue.node.getTimestamp();
            
            // Süreleri formatla
            const currentTime = formatTime(progress.current);
            const totalTime = formatTime(progress.total);
            const progressBar = createProgressBar(progress.progress);

            // Embed oluştur
            const embed = new EmbedBuilder()
                .setTitle('🎵 Şimdi Çalıyor')
                .setDescription(`**${track.title}**`)
                .setColor('#00FF00')
                .setThumbnail(track.thumbnail)
                .addFields(
                    { name: '👤 Sanatçı', value: track.author || 'Bilinmiyor', inline: true },
                    { name: '⏱️ Süre', value: totalTime || '00:00', inline: true },
                    { name: '🔊 Ses', value: `${queue.node.volume}%`, inline: true },
                    { name: '📊 İlerleme', value: `${currentTime || '00:00'} ┃ ${progressBar} ┃ ${totalTime || '00:00'}`, inline: false }
                )
                .setFooter({ 
                    text: `İsteyen: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            // Butonları oluştur
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setLabel(queue.node.isPaused() ? '▶️ Devam Et' : '⏸️ Duraklat')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('skip')
                        .setLabel('⏭️ Geç')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('loop')
                        .setLabel(queue.repeatMode ? '🔁 Tekrar: Açık' : '🔁 Tekrar: Kapalı')
                        .setStyle(queue.repeatMode ? ButtonStyle.Success : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('shuffle')
                        .setLabel('🔀 Karıştır')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('⏹️ Durdur')
                        .setStyle(ButtonStyle.Danger)
                );

            // Mesajı gönder
            const message = await interaction.reply({ 
                embeds: [embed], 
                components: [row],
                fetchReply: true 
            });

            // Mesajı kaydet
            setLastNowPlayingMessage(interaction.guild.id, message);

            // Buton etkileşimlerini dinle
            const collector = message.createMessageComponentCollector({ 
                time: 300000 // 5 dakika
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ 
                        content: '❌ Bu butonları sadece komutu kullanan kişi kullanabilir!', 
                        ephemeral: true 
                    });
                }

                try {
                    switch (i.customId) {
                        case 'pause':
                            queue.node.setPaused(!queue.node.isPaused());
                            break;
                        case 'skip':
                            queue.node.skip();
                            break;
                        case 'loop':
                            queue.setRepeatMode(queue.repeatMode ? 0 : 2);
                            break;
                        case 'shuffle':
                            queue.tracks.shuffle();
                            break;
                        case 'stop':
                            queue.delete();
                            await i.update({ 
                                embeds: [embed.setDescription('🎵 Müzik durduruldu!')], 
                                components: [] 
                            });
                            return collector.stop();
                    }

                    // Butonları güncelle
                    const newRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('pause')
                                .setLabel(queue.node.isPaused() ? '▶️ Devam Et' : '⏸️ Duraklat')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('skip')
                                .setLabel('⏭️ Geç')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('loop')
                                .setLabel(queue.repeatMode ? '🔁 Tekrar: Açık' : '🔁 Tekrar: Kapalı')
                                .setStyle(queue.repeatMode ? ButtonStyle.Success : ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('shuffle')
                                .setLabel('🔀 Karıştır')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('stop')
                                .setLabel('⏹️ Durdur')
                                .setStyle(ButtonStyle.Danger)
                        );

                    await i.update({ components: [newRow] });
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
                            .setCustomId('pause')
                            .setLabel('⏸️ Duraklat')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('skip')
                            .setLabel('⏭️ Geç')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('loop')
                            .setLabel('🔁 Tekrar')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('shuffle')
                            .setLabel('🔀 Karıştır')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setLabel('⏹️ Durdur')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    );

                message.edit({ components: [disabledRow] }).catch(console.error);
            });

        } catch (error) {
            console.error('Nowplaying komutu hatası:', error);
            
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

// Yardımcı fonksiyonlar
function createProgressBar(progress) {
    if (!progress || isNaN(progress) || progress < 0 || progress > 1) {
        progress = 0;
    }
    
    const length = 12;
    const filled = Math.max(0, Math.min(length, Math.round(length * progress)));
    const empty = length - filled;
    
    const filledBar = '▬'.repeat(filled);
    const emptyBar = '▬'.repeat(empty);
    
    return `${filledBar}🔘${emptyBar}`;
}

function formatTime(ms) {
    if (!ms || isNaN(ms)) return '00:00';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 