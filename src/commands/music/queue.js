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
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Her sayfada 10 şarkı göster
            const tracksPerPage = 10;
            const totalPages = Math.ceil(queue.tracks.size / tracksPerPage) || 1;
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
                        (tracks.length > 0 ?
                            `**Sıradaki Şarkılar:**\n` +
                            tracks.map((track, i) =>
                                `${start + i + 1}. **${track.title}** - ${track.author}`
                            ).join('\n')
                            : '_Sırada başka şarkı yok._')
                    )
                    .setColor('#1976D2')
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
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Yetki Yok')
                        .setDescription('Bu butonları sadece komutu kullanan kişi kullanabilir!')
                        .setColor('#FF0000');
                    return i.reply({ embeds: [embed], ephemeral: true });
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
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
