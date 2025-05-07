import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

// Her sunucu için son nowplaying mesajını tutacak Map
const lastNowPlayingMessages = new Map();

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
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const command = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Şu anda çalan şarkıyı gösterir'),

    async execute(interaction) {
        try {
            // Önceki nowplaying mesajını sil
            const lastMsg = lastNowPlayingMessages.get(interaction.guildId);
            if (lastMsg) {
                try { await lastMsg.delete().catch(() => {}); } catch {}
            }

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const track = queue.currentTrack;
            if (!track) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            // Şarkı türüne göre renk belirleme
            let color = '#FF0000'; // Varsayılan renk
            const title = track.title.toLowerCase();
            
            if (title.includes('pop')) color = '#FF69B4';
            else if (title.includes('rock')) color = '#FF0000';
            else if (title.includes('rap') || title.includes('hip hop')) color = '#000000';
            else if (title.includes('classic')) color = '#FFD700';
            else if (title.includes('jazz')) color = '#8B4513';
            else if (title.includes('electronic') || title.includes('edm')) color = '#00FFFF';

            const progress = queue.node.getTimestamp();
            const progressPercent = progress?.current && track?.durationMS 
                ? progress.current / track.durationMS 
                : 0;

            const currentTime = formatTime(progress?.current || 0);
            const totalTime = formatTime(track?.durationMS || 0);
            const progressBar = createProgressBar(progressPercent);

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şimdi Çalıyor')
                .setDescription(`**${track.title}**`)
                .addFields(
                    { name: '👤 Sanatçı', value: track.author || 'Bilinmiyor', inline: true },
                    { name: '⏱️ Süre', value: totalTime, inline: true },
                    { name: '🔊 Ses', value: `${queue.node.volume}%`, inline: true },
                    { name: '📊 İlerleme', value: `${currentTime} ┃ ${progressBar} ┃ ${totalTime}`, inline: false }
                )
                .setThumbnail(track.thumbnail)
                .setColor(color)
                .setFooter({ 
                    text: `İsteyen: ${track.requestedBy?.tag || interaction.user.tag}`,
                    iconURL: track.requestedBy?.displayAvatarURL() || interaction.user.displayAvatarURL()
                });

            // Kontrol butonları
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
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setLabel('⏹️ Durdur')
                        .setStyle(ButtonStyle.Danger)
                );

            const message = await interaction.reply({
                embeds: [embed],
                components: [row],
                fetchReply: true
            });

            // Son mesajı kaydet
            lastNowPlayingMessages.set(interaction.guildId, message);

            // Buton etkileşimlerini topla
            const collector = message.createMessageComponentCollector({
                time: 300000 // 5 dakika
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return await i.reply({
                        content: '❌ Bu butonları sadece komutu kullanan kişi kullanabilir!',
                        ephemeral: true
                    });
                }

                const queue = player.nodes.get(i.guildId);
                if (!queue) {
                    return await i.reply({
                        content: '❌ Şu anda çalan bir şarkı yok!',
                        ephemeral: true
                    });
                }

                switch (i.customId) {
                    case 'pause':
                        queue.node.setPaused(!queue.node.isPaused());
                        await i.update({
                            components: [
                                new ActionRowBuilder()
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
                                            .setStyle(ButtonStyle.Secondary),
                                        new ButtonBuilder()
                                            .setCustomId('stop')
                                            .setLabel('⏹️ Durdur')
                                            .setStyle(ButtonStyle.Danger)
                                    )
                            ]
                        });
                        break;

                    case 'skip':
                        queue.node.skip();
                        await i.update({
                            components: []
                        });
                        break;

                    case 'loop':
                        queue.setRepeatMode(queue.repeatMode === 0 ? 1 : 0);
                        await i.update({
                            components: [
                                new ActionRowBuilder()
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
                                            .setStyle(ButtonStyle.Secondary),
                                        new ButtonBuilder()
                                            .setCustomId('stop')
                                            .setLabel('⏹️ Durdur')
                                            .setStyle(ButtonStyle.Danger)
                                    )
                            ]
                        });
                        break;

                    case 'shuffle':
                        queue.tracks.shuffle();
                        await i.update({
                            components: []
                        });
                        break;

                    case 'stop':
                        queue.delete();
                        await i.update({
                            components: []
                        });
                        break;
                }
            });

            collector.on('end', () => {
                message.edit({
                    components: []
                }).catch(() => {});
            });

            // Her 10 saniyede bir mesajı güncelle
            const updateInterval = setInterval(async () => {
                try {
                    const currentQueue = player.nodes.get(interaction.guildId);
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
                    const progressPercent = progress?.current && currentTrack?.durationMS 
                        ? progress.current / currentTrack.durationMS 
                        : 0;

                    const currentTime = formatTime(progress?.current || 0);
                    const totalTime = formatTime(currentTrack?.durationMS || 0);
                    const progressBar = createProgressBar(progressPercent);

                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('🎵 Şimdi Çalıyor')
                        .setDescription(`**${currentTrack.title}**`)
                        .addFields(
                            { name: '👤 Sanatçı', value: currentTrack.author || 'Bilinmiyor', inline: true },
                            { name: '⏱️ Süre', value: totalTime, inline: true },
                            { name: '🔊 Ses', value: `${currentQueue.node.volume}%`, inline: true },
                            { name: '📊 İlerleme', value: `${currentTime} ┃ ${progressBar} ┃ ${totalTime}`, inline: false }
                        )
                        .setThumbnail(currentTrack.thumbnail)
                        .setColor(color)
                        .setFooter({ 
                            text: `İsteyen: ${currentTrack.requestedBy?.tag || interaction.user.tag}`,
                            iconURL: currentTrack.requestedBy?.displayAvatarURL() || interaction.user.displayAvatarURL()
                        });

                    await message.edit({
                        embeds: [updatedEmbed]
                    });
                } catch (error) {
                    console.error('Mesaj güncelleme hatası:', error);
                    clearInterval(updateInterval);
                }
            }, 10000);

            // 15 dakika sonra güncellemeyi durdur
            setTimeout(() => {
                clearInterval(updateInterval);
            }, 15 * 60 * 1000);

        } catch (error) {
            console.error('Nowplaying hatası:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Bir hata oluştu!',
                    ephemeral: true
                });
            }
        }
    }
}; 