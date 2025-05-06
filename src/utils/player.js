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
            
            const guildId = queue.guild.id;
            
            if (disconnectTimers.has(guildId)) {
                clearTimeout(disconnectTimers.get(guildId));
            }
            
            // Doğrudan bağlantıyı al (bot hala kanalda olmalı)
            const connection = getVoiceConnection(guildId);
            
            if (!connection) {
                console.log(`⚠️ ${guildId} için ses bağlantısı bulunamadı`);
                return;
            }
            
            console.log(`⏲️ ${guildId} için 5 dakikalık ayrılma zamanlayıcısı başlatıldı`);
            
            // Yeni bir timeout oluştur ve haritada sakla
            const timerId = setTimeout(() => {
                try {
                    // 5 dakika sonra, bağlantıyı tekrar kontrol et ve kapat
                    const currentConnection = getVoiceConnection(guildId);
                    if (currentConnection) {
                        console.log(`⏰ ${guildId} için 5 dakika doldu, kanaldan ayrılıyor`);
                        queue.metadata?.send('🕒 Son 5 dakikadır hiçbir şarkı çalınmadı, kanaldan ayrılıyorum 👋');
                        currentConnection.destroy();
                    }
                    disconnectTimers.delete(guildId);
                } catch (error) {
                    console.error('Bağlantıyı kapatma hatası:', error);
                }
            }, 5 * 60 * 1000); // 5 dakika
            
            disconnectTimers.set(guildId, timerId);
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
    
    // Debug mesajlarını etkinleştir
    player.events.on('debug', (message) => {
        console.log(`[Player Debug] ${message}`);
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
        }
        
        // Bağlantıyı kapat
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Manuel ayrılma hatası:', error);
        return false;
    }
};