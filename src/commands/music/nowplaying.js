import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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

            const player = interaction.client.manager.get(interaction.guild.id);

            if (!player) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const track = player.queue.current;
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

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şimdi Çalıyor')
                .setDescription(`**${track.title}**`)
                .setColor(color)
                .addFields(
                    { name: '👤 Sanatçı', value: track.author, inline: true },
                    { name: '⏱️ Süre', value: track.duration, inline: true },
                    { name: '🔊 Ses Seviyesi', value: `${player.volume}%`, inline: true }
                )
                .setThumbnail(track.thumbnail)
                .setFooter({ text: `İsteyen: ${track.requester?.tag || 'Bilinmiyor'}` });

            // Kontrol butonları
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pause')
                        .setLabel(player.paused ? '▶️ Devam Et' : '⏸️ Duraklat')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('skip')
                        .setLabel('⏭️ Geç')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('loop')
                        .setLabel(player.trackRepeat ? '🔁 Tekrarı Kapat' : '🔁 Tekrarla')
                        .setStyle(player.trackRepeat ? ButtonStyle.Success : ButtonStyle.Secondary),
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

                const player = interaction.client.manager.get(i.guildId);
                if (!player) {
                    return await i.reply({
                        content: '❌ Şu anda çalan bir şarkı yok!',
                        ephemeral: true
                    });
                }

                switch (i.customId) {
                    case 'pause':
                        player.pause(!player.paused);
                        await i.update({
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('pause')
                                            .setLabel(player.paused ? '▶️ Devam Et' : '⏸️ Duraklat')
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId('skip')
                                            .setLabel('⏭️ Geç')
                                            .setStyle(ButtonStyle.Secondary),
                                        new ButtonBuilder()
                                            .setCustomId('loop')
                                            .setLabel(player.trackRepeat ? '🔁 Tekrarı Kapat' : '🔁 Tekrarla')
                                            .setStyle(player.trackRepeat ? ButtonStyle.Success : ButtonStyle.Secondary),
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
                        player.stop();
                        await i.update({
                            components: []
                        });
                        break;

                    case 'loop':
                        player.setTrackRepeat(!player.trackRepeat);
                        await i.update({
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('pause')
                                            .setLabel(player.paused ? '▶️ Devam Et' : '⏸️ Duraklat')
                                            .setStyle(ButtonStyle.Primary),
                                        new ButtonBuilder()
                                            .setCustomId('skip')
                                            .setLabel('⏭️ Geç')
                                            .setStyle(ButtonStyle.Secondary),
                                        new ButtonBuilder()
                                            .setCustomId('loop')
                                            .setLabel(player.trackRepeat ? '🔁 Tekrarı Kapat' : '🔁 Tekrarla')
                                            .setStyle(player.trackRepeat ? ButtonStyle.Success : ButtonStyle.Secondary),
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
                        player.queue.shuffle();
                        await i.reply({
                            content: '🔀 Sıra karıştırıldı!',
                            ephemeral: true
                        });
                        break;

                    case 'stop':
                        player.destroy();
                        await i.update({
                            components: []
                        });
                        break;
                }
            });

            // 5 dakika sonra butonları kaldır
            setTimeout(() => {
                message.edit({ components: [] }).catch(() => {});
            }, 300000);
        } catch (error) {
            console.error('Nowplaying hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 