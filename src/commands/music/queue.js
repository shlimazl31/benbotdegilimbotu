import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

            // Her sayfada 10 şarkı göster
            const tracksPerPage = 10;
            const totalPages = Math.ceil(queue.tracks.size / tracksPerPage);
            let currentPage = 0;

            // Sayfalama butonları
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('first')
                        .setLabel('⏮️ İlk')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀️ Önceki')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('▶️ Sonraki')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('last')
                        .setLabel('⏭️ Son')
                        .setStyle(ButtonStyle.Primary)
                );

            // Sayfa oluşturma fonksiyonu
            const generatePage = (page) => {
                const start = page * tracksPerPage;
                const end = start + tracksPerPage;
                const tracks = queue.tracks.toArray().slice(start, end);

                const embed = new EmbedBuilder()
                    .setTitle('📋 Şarkı Sırası')
                    .setDescription(
                        `**Şu An Çalıyor:**\n` +
                        `🎵 **${queue.currentTrack.title}** - ${queue.currentTrack.author}\n\n` +
                        `**Sıradaki Şarkılar:**\n` +
                        tracks.map((track, i) => 
                            `${start + i + 1}. **${track.title}** - ${track.author}`
                        ).join('\n')
                    )
                    .setColor('#FF0000')
                    .setFooter({ 
                        text: `Sayfa ${page + 1}/${totalPages} • Toplam ${queue.tracks.size} şarkı`,
                        iconURL: interaction.guild.iconURL()
                    });

                return embed;
            };

            // İlk mesajı gönder
            const message = await interaction.reply({ 
                embeds: [generatePage(currentPage)],
                components: [buttons],
                fetchReply: true 
            });

            // Buton etkileşimlerini dinle
            const collector = message.createMessageComponentCollector({ 
                time: 5 * 60 * 1000 // 5 dakika
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ 
                        content: '❌ Bu butonları sadece komutu kullanan kişi kullanabilir!', 
                        ephemeral: true 
                    });
                }

                switch (i.customId) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(totalPages - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = totalPages - 1;
                        break;
                }

                await i.update({ 
                    embeds: [generatePage(currentPage)],
                    components: [buttons]
                });
            });

            // 5 dakika sonra butonları kaldır
            setTimeout(() => {
                message.edit({ components: [] }).catch(() => {});
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
