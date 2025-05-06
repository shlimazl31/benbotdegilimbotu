import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import play from 'play-dl';
import { getVoiceConnection } from '@discordjs/voice';

let player = null;

// Her sunucu için zamanlayıcıları tutacak bir harita
const disconnectTimers = new Map();
// Son aktivite zamanını tutacak harita
const lastActivityTime = new Map();

// Ses bağlantılarının otomatik yönetimi için bu fonksiyonu kullanalım
const manageVoiceConnection = (guildId) => {
    // Aktivite zamanını güncelle
    lastActivityTime.set(guildId, Date.now());
    console.log(`⏱️ ${guildId} için son aktivite zamanı güncellendi`);
    
    // Eğer bir zamanlayıcı yoksa, oluştur
    if (!disconnectTimers.has(guildId)) {
        // Her 30 saniyede bir kontrol eden bir interval oluştur
        const timerId = setInterval(() => {
            try {
                // Bağlantı hala var mı kontrol et
                const connection = getVoiceConnection(guildId);
                if (!connection) {
                    console.log(`ℹ️ ${guildId} için bağlantı bulunamadı, interval temizleniyor`);
                    clearInterval(disconnectTimers.get(guildId));
                    disconnectTimers.delete(guildId);
                    lastActivityTime.delete(guildId);
                    return;
                }
                
                // Son aktiviteden beri geçen süre
                const lastActivity = lastActivityTime.get(guildId) || Date.now();
                const timePassed = Date.now() - lastActivity;
                const timePassedMinutes = Math.floor(timePassed / (1000 * 60));
                
                // Debug
                console.log(`⏲️ ${guildId} için geçen süre: ${timePassedMinutes} dakika`);
                
                // 5 dakika geçmiş mi kontrol et
                if (timePassed >= 5 * 60 * 1000) {
                    console.log(`🔔 ${guildId} için 5 dakika doldu, kanaldan ayrılıyor`);
                    
                    // Mesaj göndermek için player'dan queue'yu bul
                    player.nodes.get(guildId)?.queue?.metadata?.send('🕒 Son 5 dakikadır hiçbir şarkı çalınmadı, kanaldan ayrılıyorum 👋')
                        .catch(err => console.error('Mesaj gönderme hatası:', err));
                    
                    // Bağlantıyı kapat
                    setTimeout(() => {
                        connection.destroy();
                        console.log(`👋 ${guildId} için bot ses kanalından ayrıldı (5 dakika inaktif)`);
                        
                        // İnterval'i temizle
                        clearInterval(disconnectTimers.get(guildId));
                        disconnectTimers.delete(guildId);
                        lastActivityTime.delete(guildId);
                    }, 500);
                }
            } catch (error) {
                console.error(`Interval kontrol hatası (${guildId}):`, error);
            }
        }, 30 * 1000); // Her 30 saniyede bir kontrol et
        
        disconnectTimers.set(guildId, timerId);
        console.log(`🔄 ${guildId} için interval oluşturuldu`);
    }
};

// Döngüsel yapıyı güvenli bir şekilde string'e çevir
const safeStringify = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(
        obj,
        (key, value) => {
            // Null, primitif tipler ve fonksiyonlar için doğrudan dön
            if (value === null || typeof value !== 'object') {
                return value;
            }
            
            // Daha önce gördüysek, döngüsel referansı önlemek için [Circular] dön
            if (seen.has(value)) {
                return '[Circular]';
            }
            
            // Değeri işaretleyelim
            seen.add(value);
            return value;
        },
        2
    );
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
            // Şarkı çalmaya başladığında aktivite zamanını güncelle
            manageVoiceConnection(queue.guild.id);

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
            
            // Sıra bittiğinde son aktivite zamanını güncelle, timer zaten çalışıyor olmalı
            lastActivityTime.set(queue.guild.id, Date.now());
            console.log(`⏱️ ${queue.guild.id} için emptyQueue olayında son aktivite zamanı güncellendi`);
            
            // Zamanlayıcının zaten var olduğundan emin ol
            manageVoiceConnection(queue.guild.id);
        } catch (error) {
            console.error('emptyQueue event hatası:', error);
        }
    });
    
    // Yeni event listener'lar ekle
    player.events.on('queueAdd', (queue) => {
        try {
            // Sıraya şarkı eklendiğinde aktivite zamanını güncelle
            manageVoiceConnection(queue.guild.id);
            console.log(`📝 ${queue.guild.id} için queueAdd olayında son aktivite zamanı güncellendi`);
        } catch (error) {
            console.error('queueAdd event hatası:', error);
        }
    });
    
    // Debug mesajlarını düzgün formatlı göster (döngüsel yapı hatasını önle)
    player.events.on('debug', (message) => {
        try {
            // Debug mesajlarını çok fazla log'lamamak için kontrol ekleyelim
            // Sadece string mesajları veya önemli objeleri loglayalım
            if (typeof message === 'string') {
                console.log(`[Player Debug] ${message}`);
            } else if (typeof message === 'object') {
                // Sadece belirli kritik değerleri çıkaralım
                const simplifiedDebug = {
                    type: message.type || 'unknown',
                    name: message.name || null,
                    id: message.id || null,
                    status: message.status || null,
                    message: message.message || null
                };
                
                console.log(`[Player Debug] ${safeStringify(simplifiedDebug)}`);
            }
        } catch (error) {
            console.error('Debug event hatası (hata yakalandı):', error.message);
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
            clearInterval(disconnectTimers.get(guildId));
            disconnectTimers.delete(guildId);
            lastActivityTime.delete(guildId);
            console.log(`🗑️ ${guildId} için interval ve aktivite zamanı temizlendi`);
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