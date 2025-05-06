import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import play from 'play-dl';
import { getVoiceConnection } from '@discordjs/voice';

let player = null;

// Her sunucu için zamanlayıcıları tutacak bir harita
const disconnectTimers = new Map();

export const getPlayer = async (client) => {
    if (player) return player;

    player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0
        },
        connectionOptions: {
            selfDeaf: true
        }
    });

    try {
        // Önce default extractorları yükle
        await player.extractors.loadDefault();
        console.log('✅ Default extractorlar yüklendi');
    } catch (error) {
        console.error('❌ Default extractorlar yüklenemedi:', error);
    }

    try {
        // Sonra YouTube extractoru yükle
        await player.extractors.register(YoutubeiExtractor, {
            overrideBridgeMode: "yt",
            streamOptions: {
                highWaterMark: 1 << 25,
                dlChunkSize: 0
            }
        });
        console.log('✅ YouTubei extractor yüklendi');
    } catch (error) {
        console.error('❌ YouTubei extractor yüklenemedi:', error);
    }
    
    // Debug için player'daki extractorları kontrol et
    console.log(`Yüklenen extractor sayısı: ${player.extractors.size}`);
    
    // Player event'lerini ayarla
    player.events.on('playerStart', (queue, track) => {
        try {
            // Eğer bir zamanlayıcı varsa, iptal et
            const guildId = queue.guild.id;
            if (disconnectTimers.has(guildId)) {
                clearTimeout(disconnectTimers.get(guildId));
                disconnectTimers.delete(guildId);
                console.log(`🔄 ${guildId} için ayrılma zamanlayıcısı iptal edildi`);
            }

            queue.metadata?.send(`🎵 Şimdi çalıyor: **${track.title}**!`);
            console.log(`🎵 Şarkı çalınıyor: ${track.title}`);
        } catch (error) {
            console.error('playerStart event hatası:', error);
        }
    });
    
    player.events.on('error', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata?.send('❌ Bir hata oluştu! Tekrar deneyiniz.');
    });

    player.events.on('playerError', (queue, error) => {
        console.error('Player hatası:', error);
        queue.metadata?.send('❌ Oynatıcı hatası oluştu! Lütfen başka bir şarkı deneyiniz.');
    });

    player.events.on('emptyQueue', (queue) => {
        try {
            queue.metadata?.send('✅ Sıra bitti!');
            
            // Bu işlevin emptyQueue event'i içinde süreci başlatmasını garanti altına alıyoruz
            setTimeout(() => {
                // 5 dakika sonra kanaldan ayrılmak için zamanlayıcı ayarla
                const guildId = queue.guild.id;
                const fiveMinutesInMs = 5 * 60 * 1000;

                console.log(`⏲️ ${guildId} için 5 dakikalık ayrılma zamanlayıcısı başlatıldı`);
                
                // Eğer mevcut bir zamanlayıcı varsa, onu temizleyelim
                if (disconnectTimers.has(guildId)) {
                    clearTimeout(disconnectTimers.get(guildId));
                    disconnectTimers.delete(guildId);
                }
                
                const timerId = setTimeout(() => {
                    try {
                        const connection = getVoiceConnection(guildId);
                        if (connection) {
                            connection.destroy();
                            queue.metadata?.send('🕒 Son 5 dakikadır hiçbir şarkı çalınmadı, kanaldan ayrılıyorum 👋');
                            console.log(`👋 ${guildId} için bot ses kanalından ayrıldı (5 dakika inaktif)`);
                        }
                        disconnectTimers.delete(guildId);
                    } catch (error) {
                        console.error('Bağlantıyı kapatma hatası:', error);
                    }
                }, fiveMinutesInMs);

                disconnectTimers.set(guildId, timerId);
            }, 100); // Hemen çalışmasını önlemek için kısa bir gecikme
        } catch (error) {
            console.error('emptyQueue event hatası:', error);
        }
    });
    
    // Debug mesajlarını etkinleştir
    player.events.on('debug', (message) => {
        console.log(`[Player Debug] ${message}`);
    });
    
    player.events.on('connectionError', (queue, error) => {
        console.error('Bağlantı hatası:', error);
        queue.metadata?.send('❌ Ses kanalına bağlanırken bir hata oluştu. Tekrar deneyiniz.');
    });

    player.events.on('connectionDestroyed', (queue) => {
        console.log(`⚠️ ${queue.guild.id} için ses bağlantısı bozuldu`);
    });
    
    // Manuel olarak odadan ayrılma işlemi
    player.events.on('disconnect', (queue) => {
        try {
            console.log(`🛑 Bot ses kanalından ayrıldı. Guild: ${queue.guild.id}`);
            // Zamanlayıcıyı iptal et
            if (disconnectTimers.has(queue.guild.id)) {
                clearTimeout(disconnectTimers.get(queue.guild.id));
                disconnectTimers.delete(queue.guild.id);
                console.log(`🗑️ ${queue.guild.id} için ayrılma zamanlayıcısı temizlendi`);
            }
        } catch (error) {
            console.error('disconnect event hatası:', error);
        }
    });

    return player;
};