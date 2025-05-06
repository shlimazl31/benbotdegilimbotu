import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import play from 'play-dl';
import { getVoiceConnection } from '@discordjs/voice';

let player = null;

// Her sunucu için zamanlayıcıları tutacak bir harita
const disconnectTimers = new Map();

// Ses bağlantılarının otomatik yönetimi için bu fonksiyonu kullanalım
const manageVoiceConnection = (guildId, channel) => {
    // Eğer bir zamanlayıcı varsa, iptal et
    if (disconnectTimers.has(guildId)) {
        clearTimeout(disconnectTimers.get(guildId));
        disconnectTimers.delete(guildId);
        console.log(`🔄 ${guildId} için ayrılma zamanlayıcısı iptal edildi`);
    }
};

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
            // Şarkı çalmaya başladığında bağlantıyı yönet
            manageVoiceConnection(queue.guild.id, queue.channel);

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

    // Özel kanaldan ayrılma mekanizması
    player.events.on('emptyQueue', (queue) => {
        try {
            queue.metadata?.send('✅ Sıra bitti!');
            
            // 5 dakika sonra kanaldan ayrılmak için işlem yap
            // Ama önce mevcut event akışının tamamlanmasını bekle
            setTimeout(() => {
                try {
                    const guildId = queue.guild.id;
                    
                    // Mevcut timer varsa temizle
                    if (disconnectTimers.has(guildId)) {
                        clearTimeout(disconnectTimers.get(guildId));
                    }
                    
                    console.log(`⏲️ ${guildId} için 5 dakikalık ayrılma zamanlayıcısı başlatıldı`);
                    
                    // Yeni bir timeout oluştur
                    const timerId = setTimeout(() => {
                        try {
                            const currentConnection = getVoiceConnection(guildId);
                            if (currentConnection) {
                                console.log(`⏰ ${guildId} için 5 dakika doldu, kanaldan ayrılıyor`);
                                queue.metadata?.send('🕒 Son 5 dakikadır hiçbir şarkı çalınmadı, kanaldan ayrılıyorum 👋')
                                    .catch(err => console.error('Mesaj gönderme hatası:', err));
                                
                                // Kısa bir gecikme verip mesajın gönderilmesi için zaman tanı
                                setTimeout(() => {
                                    currentConnection.destroy();
                                    console.log(`✅ Bağlantı kapatıldı: ${guildId}`);
                                }, 500);
                            }
                            disconnectTimers.delete(guildId);
                        } catch (error) {
                            console.error('Bağlantıyı kapatma hatası:', error);
                        }
                    }, 5 * 60 * 1000); // 5 dakika (300,000 ms)
                    
                    disconnectTimers.set(guildId, timerId);
                } catch (innerError) {
                    console.error('Timer oluşturma hatası:', innerError);
                }
            }, 1000); // 1 saniye gecikme
        } catch (error) {
            console.error('emptyQueue event hatası:', error);
        }
    });
    
    // Yeni event listener'lar ekle
    player.events.on('queueAdd', (queue) => {
        try {
            // Sıraya şarkı eklendiğinde bağlantıyı yönet
            manageVoiceConnection(queue.guild.id, queue.channel);
        } catch (error) {
            console.error('queueAdd event hatası:', error);
        }
    });
    
    // Debug mesajlarını düzgün formatlı göster
    player.events.on('debug', (message) => {
        try {
            if (typeof message === 'object') {
                console.log(`[Player Debug] ${JSON.stringify(message, null, 2)}`);
            } else {
                console.log(`[Player Debug] ${message}`);
            }
        } catch (error) {
            console.error('Debug event hatası:', error);
        }
    });
    
    player.events.on('connectionError', (queue, error) => {
        console.error('Bağlantı hatası:', error);
        queue.metadata?.send('❌ Ses kanalına bağlanırken bir hata oluştu. Tekrar deneyiniz.');
    });

    return player;
};

// Kanaldan manuel çıkma fonksiyonu
export const leaveVoiceChannel = (guildId) => {
    try {
        // Zamanlayıcıyı iptal et
        if (disconnectTimers.has(guildId)) {
            clearTimeout(disconnectTimers.get(guildId));
            disconnectTimers.delete(guildId);
            console.log(`🗑️ ${guildId} için ayrılma zamanlayıcısı temizlendi`);
        }
        
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