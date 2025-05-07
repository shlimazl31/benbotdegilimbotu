import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getPlayer, checkQueueState } from '../../utils/player.js';

// Her sunucu için son nowplaying mesajını tutacak Map
const lastNowPlayingMessages = new Map();

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
            const queueState = checkQueueState(interaction.guildId);

            if (!queue || !queue.isPlaying() || !queueState?.isPlaying) {
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

            const progress = queue.node.createProgressBar();
            const timestamp = queue.node.getTimestamp();

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şimdi Çalıyor')
                .setDescription(`**${track.title}**`)
                .addFields(
                    { name: '👤 Sanatçı', value: track.author, inline: true },
                    { name: '⏱️ Süre', value: track.duration, inline: true },
                    { name: '🔊 Ses', value: `${queue.node.volume}%`, inline: true },
                    { name: '📊 İlerleme', value: progress, inline: false }
                )
                .setThumbnail(track.thumbnail)
                .setColor(color)
                .setFooter({ 
                    text: `İsteyen: ${track.requestedBy.tag}`,
                    iconURL: track.requestedBy.displayAvatarURL()
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
                const queueState = checkQueueState(i.guildId);
                
                if (!queue || !queueState?.isPlaying) {
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
                    const currentQueueState = checkQueueState(interaction.guildId);
                    
                    if (!currentQueue || !currentQueue.isPlaying() || !currentQueueState?.isPlaying) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const currentTrack = currentQueue.currentTrack;
                    if (!currentTrack) {
                        clearInterval(updateInterval);
                        return;
                    }

                    const progress = currentQueue.node.createProgressBar();
                    const timestamp = currentQueue.node.getTimestamp();

                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('🎵 Şimdi Çalıyor')
                        .setDescription(`**${currentTrack.title}**`)
                        .addFields(
                            { name: '👤 Sanatçı', value: currentTrack.author, inline: true },
                            { name: '⏱️ Süre', value: currentTrack.duration, inline: true },
                            { name: '🔊 Ses', value: `${currentQueue.node.volume}%`, inline: true },
                            { name: '📊 İlerleme', value: progress, inline: false }
                        )
                        .setThumbnail(currentTrack.thumbnail)
                        .setColor(color)
                        .setFooter({ 
                            text: `İsteyen: ${currentTrack.requestedBy.tag}`,
                            iconURL: currentTrack.requestedBy.displayAvatarURL()
                        });

                    await message.edit({
                        embeds: [updatedEmbed]
                    }).catch(() => {});
                } catch (error) {
                    console.error('🔴 Nowplaying güncelleme hatası:', error);
                    clearInterval(updateInterval);
                }
            }, 10000);

        } catch (error) {
            console.error('🔴 Nowplaying komutu hatası:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Bir hata oluştu!',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
}; 