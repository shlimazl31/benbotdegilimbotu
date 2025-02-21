import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Tüm komutları gösterir'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Komutları')
            .setDescription('Kullanılabilir tüm komutlar:')
            .addFields(
                { 
                    name: '🎵 Müzik Komutları',
                    value: 
                    '`/play` - Şarkı çalar\n' +
                    '`/pause` - Şarkıyı duraklatır\n' +
                    '`/resume` - Şarkıyı devam ettirir\n' +
                    '`/stop` - Müziği durdurur\n' +
                    '`/skip` - Şarkıyı atlar\n' +
                    '`/leave` - Kanaldan çıkar'
                },
                {
                    name: '📑 Sıra Komutları',
                    value: 
                    '`/queue` - Şarkı sırasını gösterir\n' +
                    '`/clear` - Sırayı temizler\n' +
                    '`/shuffle` - Sırayı karıştırır\n' +
                    '`/loop` - Tekrar modunu ayarlar'
                },
                {
                    name: '⚙️ Kontrol Komutları',
                    value: 
                    '`/volume` - Ses seviyesini ayarlar (1-100)\n' +
                    '`/seek` - Şarkının belirli bir saniyesine atlar\n' +
                    '`/nowplaying` - Çalan şarkının bilgilerini gösterir'
                },
                {
                    name: '📋 Playlist Komutları',
                    value:
                    '`/playlist play` - Playlist çalar\n' +
                    '`/playlist info` - Playlist bilgilerini gösterir'
                },
                {
                    name: '👮 Moderasyon Komutları',
                    value:
                    '`/purge` - Belirtilen sayıda mesajı siler (1-100)'
                }
            )
            .setColor('#FF0000')
            .setFooter({ text: 'Daha fazla özellik yakında!' });

        await interaction.reply({ embeds: [embed] });
    }
}; 