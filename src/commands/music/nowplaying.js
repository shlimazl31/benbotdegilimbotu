import { SlashCommandBuilder } from 'discord.js';
import { checkQueueState, setLastNowPlayingMessage, clearLastNowPlayingMessage, updateQueueState } from '../../utils/player.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useMainPlayer } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Şu anda çalan şarkıyı gösterir'),

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

            // Player'ı al
            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guild.id);

            // Kuyruk durumunu kontrol et
            if (!queue || !queue.isPlaying()) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Önceki mesajı temizle
            await clearLastNowPlayingMessage(interaction.guild.id);

            const track = queue.currentTrack;
            const progress = queue.node.getTimestamp();
            const progressBar = createProgressBar(progress.current.value, progress.total.value);

            // Embed oluştur
            const embed = new EmbedBuilder()
                .setTitle('🎵 Şimdi Çalıyor')
                .setDescription(`**${track.title}**`)
                .addFields(
                    { name: '👤 Sanatçı', value: track.author, inline: true },
                    { name: '⏱️ Süre', value: `${progress.current.label} / ${progress.total.label}`, inline: true },
                    { name: '🔊 Ses', value: `${queue.node.volume}%`, inline: true },
                    { name: '📊 İlerleme', value: progressBar, inline: false }
                )
                .setThumbnail(track.thumbnail)
                .setColor(getColorByGenre(track.genre))
                .setFooter({ 
                    text: `İsteyen: ${track.requestedBy.tag}`,
                    iconURL: track.requestedBy.displayAvatarURL()
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
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('loop')
                        .setLabel(queue.repeatMode === 0 ? '🔁 Tekrarla' : '🔁 Tekrarı Kapat')
                        .setStyle(queue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('shuffle')
                        .setLabel('🔀 Karıştır')
                        .setStyle(ButtonStyle.Danger),
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
                    const currentQueue = player.nodes.get(i.guild.id);
                    if (!currentQueue || !currentQueue.isPlaying()) {
                        return i.reply({
                            content: '❌ Şu anda çalan bir şarkı yok!',
                            ephemeral: true
                        });
                    }

                    switch (i.customId) {
                        case 'pause':
                            currentQueue.node.setPaused(!currentQueue.node.isPaused());
                            await i.update({
                                components: [
                                    new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('pause')
                                                .setLabel(currentQueue.node.isPaused() ? '▶️ Devam Et' : '⏸️ Duraklat')
                                                .setStyle(ButtonStyle.Primary),
                                            new ButtonBuilder()
                                                .setCustomId('skip')
                                                .setLabel('⏭️ Geç')
                                                .setStyle(ButtonStyle.Secondary),
                                            new ButtonBuilder()
                                                .setCustomId('loop')
                                                .setLabel(currentQueue.repeatMode === 0 ? '🔁 Tekrarla' : '🔁 Tekrarı Kapat')
                                                .setStyle(currentQueue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Success),
                                            new ButtonBuilder()
                                                .setCustomId('shuffle')
                                                .setLabel('🔀 Karıştır')
                                                .setStyle(ButtonStyle.Danger),
                                            new ButtonBuilder()
                                                .setCustomId('stop')
                                                .setLabel('⏹️ Durdur')
                                                .setStyle(ButtonStyle.Danger)
                                        )
                                ]
                            });
                            break;

                        case 'skip':
                            currentQueue.node.skip();
                            await i.update({ components: [] });
                            break;

                        case 'loop':
                            currentQueue.setRepeatMode(currentQueue.repeatMode === 0 ? 1 : 0);
                            await i.update({
                                components: [
                                    new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('pause')
                                                .setLabel(currentQueue.node.isPaused() ? '▶️ Devam Et' : '⏸️ Duraklat')
                                                .setStyle(ButtonStyle.Primary),
                                            new ButtonBuilder()
                                                .setCustomId('skip')
                                                .setLabel('⏭️ Geç')
                                                .setStyle(ButtonStyle.Secondary),
                                            new ButtonBuilder()
                                                .setCustomId('loop')
                                                .setLabel(currentQueue.repeatMode === 0 ? '🔁 Tekrarla' : '🔁 Tekrarı Kapat')
                                                .setStyle(currentQueue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Success),
                                            new ButtonBuilder()
                                                .setCustomId('shuffle')
                                                .setLabel('🔀 Karıştır')
                                                .setStyle(ButtonStyle.Danger),
                                            new ButtonBuilder()
                                                .setCustomId('stop')
                                                .setLabel('⏹️ Durdur')
                                                .setStyle(ButtonStyle.Danger)
                                        )
                                ]
                            });
                            break;

                        case 'shuffle':
                            currentQueue.tracks.shuffle();
                            await i.update({ components: [] });
                            break;

                        case 'stop':
                            currentQueue.delete();
                            await i.update({ components: [] });
                            break;
                    }
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
                        row.components.map(button => 
                            ButtonBuilder.from(button.data)
                                .setDisabled(true)
                        )
                    );

                message.edit({ components: [disabledRow] }).catch(console.error);
            });

            // Her 10 saniyede bir mesajı güncelle
            const updateInterval = setInterval(async () => {
                try {
                    const currentQueue = player.nodes.get(interaction.guild.id);
                    if (!currentQueue || !currentQueue.isPlaying()) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const currentTrack = currentQueue.currentTrack;
                    if (!currentTrack) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const progress = currentQueue.node.getTimestamp();
                    const progressBar = createProgressBar(progress.current.value, progress.total.value);

                    embed.setFields(
                        { name: '👤 Sanatçı', value: currentTrack.author, inline: true },
                        { name: '⏱️ Süre', value: `${progress.current.label} / ${progress.total.label}`, inline: true },
                        { name: '🔊 Ses', value: `${currentQueue.node.volume}%`, inline: true },
                        { name: '📊 İlerleme', value: progressBar, inline: false }
                    );

                    await message.edit({ embeds: [embed] });
                } catch (error) {
                    console.error('Mesaj güncelleme hatası:', error);
                    clearInterval(updateInterval);
                }
            }, 10000);

        } catch (error) {
            console.error('Nowplaying komutu hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Sistem Hatası')
                .setDescription('Bir hata oluştu! Lütfen daha sonra tekrar deneyin.')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

// Yardımcı fonksiyonlar
function createProgressBar(current, total) {
    const length = 20;
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

function getColorByGenre(genre) {
    const colors = {
        'pop': '#FF69B4',
        'rock': '#FF0000',
        'hip-hop': '#FFA500',
        'jazz': '#4B0082',
        'classical': '#800080',
        'electronic': '#00FFFF',
        'r&b': '#FF1493',
        'country': '#32CD32',
        'metal': '#696969',
        'folk': '#DEB887'
    };

    return colors[genre?.toLowerCase()] || '#FF0000';
} 