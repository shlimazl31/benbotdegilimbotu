import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Yardım menüsünü gösterir'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 Bot Komutları')
                .setDescription('Kullanılabilir tüm komutlar:')
                .addFields(
                    { 
                        name: '🎵 Müzik Komutları',
                        value: 
                        '`/join` - Ses kanalına katılır\n' +
                        '`/play` - Şarkı çalar\n' +
                        '`/search` - YouTube\'da şarkı arar\n' +
                        '`/pause` - Şarkıyı duraklatır\n' +
                        '`/resume` - Şarkıyı devam ettirir\n' +
                        '`/stop` - Müziği durdurur\n' +
                        '`/skip` - Şarkıyı atlar\n' +
                        '`/previous` - Önceki şarkıya döner\n' +
                        '`/leave` - Kanaldan çıkar'
                    },
                    {
                        name: '📑 Sıra Komutları',
                        value: 
                        '`/queue` - Şarkı sırasını gösterir\n' +
                        '`/clear` - Sırayı temizler\n' +
                        '`/shuffle` - Sırayı karıştırır\n' +
                        '`/move` - Sıradaki şarkıyı taşır\n' +
                        '`/loop` - Tekrar modunu ayarlar'
                    },
                    {
                        name: '⚙️ Kontrol Komutları',
                        value: 
                        '`/volume` - Ses seviyesini ayarlar (1-100)\n' +
                        '`/seek` - Şarkının belirli bir saniyesine atlar\n' +
                        '`/nowplaying` - Çalan şarkının bilgilerini gösterir\n' +
                        '`/lyrics` - Çalan şarkının sözlerini gösterir'
                    },
                    {
                        name: '📋 Playlist Komutları',
                        value:
                        '`/playlist play` - Playlist çalar\n' +
                        '`/playlist info` - Playlist bilgilerini gösterir'
                    },
                    {
                        name: '🔧 Genel Komutlar',
                        value:
                        '`/stats` - Bot istatistiklerini gösterir\n' +
                        '`/ping` - Bot gecikmesini gösterir\n' +
                        '`/help` - Bu menüyü gösterir'
                    },
                    {
                        name: '👮 Moderasyon Komutları',
                        value:
                        '`/purge` - Belirtilen sayıda mesajı siler (1-100)'
                    }
                )
                .setColor('#FF0000')
                .setFooter({ text: 'Daha fazla özellik yakında! | github.com/shlimazl31' });

            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Help komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 