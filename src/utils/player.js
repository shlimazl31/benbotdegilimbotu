import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import play from 'play-dl';
import { getVoiceConnection } from '@discordjs/voice';

let player = null;

// Her sunucu için zamanlayıcıları tutacak bir harita
const disconnectTimers = new Map();
// Son aktivite zamanını tutacak harita
const lastActivityTime = new Map();

// Ses bağlantılarını yönetmek için düzenli kontrol
function startDisconnectChecker() {
    console.log('🔄 Otomatik ayrılma kontrolü başlatıldı');
    
    // Her 30 saniyede bir bağlantıları kontrol et
    setInterval(() => {
        try {
            // Her guild için son aktivite zamanını kontrol et
            for (const [guildId, lastActivity] of lastActivityTime.entries()) {
                const timePassed = Date.now() - lastActivity;
                
                // Bağlantı hâlâ var mı?
                const connection = getVoiceConnection(guildId);
                if (!connection) {
                    // Bağlantı yoksa temizle
                    lastActivityTime.delete(guildId);
                    continue;
                }
                
                // 5 dakika geçmiş mi?
                if (timePassed >= 5 * 60 * 1000) {
                    console.log(`⏰ ${guildId} için 5 dakika doldu, kanaldan ayrılıyor`);
                    
                    // Mesaj gönder ve bağlantıyı kapat
                    try {
                        // Player üzerinden metadataya ulaşmaya çalış
                        const node = player.nodes.get(guildId);
                        if (node && node.queue && node.queue.metadata) {
                            node.queue.metadata.send('🕒 Son 5 dakikadır hiçbir şarkı çalınmadı, kanaldan ayrılıyorum 👋')
                                .catch(e => console.error('Mesaj gönderme hatası:', e));
                        }
                        
                        // 1 saniye bekle ve bağlantıyı kapat
                        setTimeout(() => {
                            try {
                                connection.destroy();
                                console.log(`👋 ${guildId} için bot ses kanalından ayrıldı (5 dakika inaktif)`);
                                lastActivityTime.delete(guildId);
                            } catch (error) {
                                console.error('Bağlantı kapatma hatası:', error);
                            }
                        }, 1000);
                    } catch (error) {
                        console.error('Mesaj gönderme veya bağlantı kapatma hatası:', error);
                        connection.destroy();  // Yine de bağlantıyı kapatmaya çalış
                        lastActivityTime.delete(guildId);
                    }
                }
            }
        } catch (error) {
            console.error('Disconnect checker hatası:', error);
        }
    }, 30 * 1000);
}

// Aktivite zamanını güncelle
function updateActivityTime(guildId) {
    lastActivityTime.set(guildId, Date.now());
}

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
    
    // Otomatik ayrılma kontrolcüsünü başlat
    startDisconnectChecker();
    
    // Player event'lerini ayarla
    player.events.on('playerStart', (queue, track) => {
        try {
            // Şarkı çalmaya başladığında aktivite zamanını güncelle
            updateActivityTime(queue.guild.id);
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

    // Sıra bittiğinde
    player.events.on('emptyQueue', (queue) => {
        try {
            queue.metadata?.send('✅ Sıra bitti!');
            // Sıra bittiğinde son aktivite zamanını güncelle
            updateActivityTime(queue.guild.id);
            console.log(`⏱️ ${queue.guild.id} için emptyQueue olayında son aktivite zamanı güncellendi`);
        } catch (error) {
            console.error('emptyQueue event hatası:', error);
        }
    });
    
    // Sıraya şarkı eklendiğinde
    player.events.on('queueAdd', (queue) => {
        try {
            // Sıraya şarkı eklendiğinde aktivite zamanını güncelle
            updateActivityTime(queue.guild.id);
        } catch (error) {
            console.error('queueAdd event hatası:', error);
        }
    });

    // Bağlantı hatası
    player.events.on('connectionError', (queue, error) => {
        console.error('Bağlantı hatası:', error);
        queue.metadata?.send('❌ Ses kanalına bağlanırken bir hata oluştu. Tekrar deneyiniz.');
    });

    console.log('✅ Discord Player başlatıldı');
    return player;
};

// Kanaldan manuel çıkma fonksiyonu
export const leaveVoiceChannel = (guildId) => {
    try {
        // Aktivite zamanını sil
        lastActivityTime.delete(guildId);
        
        // Bağlantıyı kapat
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
            console.log(`👋 ${guildId} için manuel olarak çıkış yapıldı`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Manuel ayrılma hatası:', error);
        return false;
    }
};