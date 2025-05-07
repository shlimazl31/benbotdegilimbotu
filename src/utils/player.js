import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import play from 'play-dl';
import { getVoiceConnection } from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';

// Player instance'ı için singleton class
class PlayerManager {
    constructor() {
        this.player = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initialize(client) {
        if (this.initialized) return this.player;

        try {
            // play-dl'i yapılandır
            await play.setToken({
                spotify: {
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
                    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
                    market: 'TR'
                }
            });

            // Player'ı oluştur
            this.player = new Player(client, {
                ytdlOptions: {
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25
                }
            });

            // Event'leri ayarla
            this.setupEvents();
            
            // Extractor'ları yükle
            await this.loadExtractors();
            
            // Otomatik ayrılma kontrolcüsünü başlat
            startDisconnectChecker();
            
            this.initialized = true;
            console.log('✅ Discord Player başlatıldı');
            
            return this.player;
        } catch (error) {
            console.error('❌ Player başlatma hatası:', error);
            this.retryCount++;
            
            if (this.retryCount < this.maxRetries) {
                console.log(`🔄 Player yeniden başlatılıyor... (${this.retryCount}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.initialize(client);
            }
            
            throw new Error('Player başlatılamadı');
        }
    }

    async loadExtractors() {
        try {
            // Default extractorları yükle
            await this.player.extractors.loadDefault();
            console.log('✅ Default extractorlar yüklendi');
            
            // YouTube extractoru yükle
            await this.player.extractors.register(YoutubeiExtractor, {
                overrideBridgeMode: "yt",
                streamOptions: {
                    highWaterMark: 1 << 25,
                    dlChunkSize: 0
                }
            });
            console.log('✅ YouTubei extractor yüklendi');
            
            console.log(`Yüklenen extractor sayısı: ${this.player.extractors.size}`);
        } catch (error) {
            console.error('❌ Extractor yükleme hatası:', error);
            throw error;
        }
    }

    setupEvents() {
        // Hata yönetimi
        this.player.events.on('error', (queue, error) => {
            console.error(`🔴 Player hatası [${queue.guild.name}]:`, error);
            
            if (queue.metadata?.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Oynatma Hatası')
                    .setDescription('Müzik çalınırken bir hata oluştu!')
                    .setColor('#FF0000');
                queue.metadata.channel.send({ embeds: [embed] }).catch(console.error);
            }
            
            updateQueueState(queue.guild.id, { 
                error: true, 
                errorMessage: error.message,
                lastError: Date.now()
            });
        });

        // Diğer event'ler...
        // [Mevcut event'ler buraya eklenecek]
    }

    getPlayer() {
        if (!this.initialized) {
            throw new Error('Player henüz başlatılmadı');
        }
        return this.player;
    }

    async restart() {
        this.initialized = false;
        this.player = null;
        this.retryCount = 0;
        return this.initialize(this.player.client);
    }
}

// Queue yönetimi için class
class QueueManager {
    constructor() {
        this.queueStates = new Map();
        this.lastActivityTime = new Map();
        this.lastNowPlayingMessages = new Map();
        this.disconnectTimers = new Map();
        this.maxQueueSize = 100; // Maksimum kuyruk boyutu
    }

    updateQueueState(guildId, state) {
        const currentState = this.queueStates.get(guildId) || {};
        this.queueStates.set(guildId, {
            ...currentState,
            ...state,
            lastUpdate: Date.now()
        });
    }

    getQueueState(guildId) {
        return this.queueStates.get(guildId);
    }

    clearQueueState(guildId) {
        this.queueStates.delete(guildId);
        this.lastActivityTime.delete(guildId);
        this.lastNowPlayingMessages.delete(guildId);
        this.disconnectTimers.delete(guildId);
    }

    updateActivityTime(guildId) {
        this.lastActivityTime.set(guildId, Date.now());
    }

    getLastActivityTime(guildId) {
        return this.lastActivityTime.get(guildId);
    }

    setLastNowPlayingMessage(guildId, message) {
        this.lastNowPlayingMessages.set(guildId, message);
    }

    getLastNowPlayingMessage(guildId) {
        return this.lastNowPlayingMessages.get(guildId);
    }

    async clearLastNowPlayingMessage(guildId) {
        const message = this.lastNowPlayingMessages.get(guildId);
        if (message) {
            try {
                await message.delete().catch(() => {});
            } catch (error) {
                console.error('Mesaj silme hatası:', error);
            }
            this.lastNowPlayingMessages.delete(guildId);
        }
    }

    setDisconnectTimer(guildId, timer) {
        this.disconnectTimers.set(guildId, timer);
    }

    clearDisconnectTimer(guildId) {
        const timer = this.disconnectTimers.get(guildId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(guildId);
        }
    }

    canAddToQueue(guildId) {
        const state = this.queueStates.get(guildId);
        return !state || (state.queueSize < this.maxQueueSize);
    }
}

// Singleton instance'ları
const playerManager = new PlayerManager();
const queueManager = new QueueManager();

// Export edilecek fonksiyonlar
export async function getPlayer(client) {
    return playerManager.initialize(client);
}

export function checkQueueState(guildId) {
    return queueManager.getQueueState(guildId);
}

export function resetQueueState(guildId) {
    queueManager.clearQueueState(guildId);
}

export function updateQueueState(guildId, state) {
    queueManager.updateQueueState(guildId, state);
}

export function updateActivityTime(guildId) {
    queueManager.updateActivityTime(guildId);
}

export function getLastActivityTime(guildId) {
    return queueManager.getLastActivityTime(guildId);
}

export function setLastNowPlayingMessage(guildId, message) {
    queueManager.setLastNowPlayingMessage(guildId, message);
}

export function getLastNowPlayingMessage(guildId) {
    return queueManager.getLastNowPlayingMessage(guildId);
}

export function clearLastNowPlayingMessage(guildId) {
    return queueManager.clearLastNowPlayingMessage(guildId);
}

export function canAddToQueue(guildId) {
    return queueManager.canAddToQueue(guildId);
}

// Ses bağlantılarını yönetmek için düzenli kontrol
function startDisconnectChecker() {
    console.log('🔄 Otomatik ayrılma kontrolü başlatıldı');
    
    setInterval(() => {
        try {
            for (const [guildId, lastActivity] of queueManager.lastActivityTime.entries()) {
                const timePassed = Date.now() - lastActivity;
                const connection = getVoiceConnection(guildId);
                
                if (!connection) {
                    queueManager.clearQueueState(guildId);
                    continue;
                }
                
                if (timePassed >= 5 * 60 * 1000) {
                    console.log(`⏰ ${guildId} için 5 dakika doldu, kanaldan ayrılıyor`);
                    
                    try {
                        const node = playerManager.getPlayer().nodes.get(guildId);
                        if (node?.queue?.metadata?.channel) {
                            const embed = new EmbedBuilder()
                                .setTitle('⏰ Otomatik Ayrılma')
                                .setDescription('Son 5 dakikadır hiçbir şarkı çalınmadı, kanaldan ayrılıyorum 👋')
                                .setColor('#FF0000');
                            node.queue.metadata.channel.send({ embeds: [embed] })
                                .catch(e => console.error('Mesaj gönderme hatası:', e));
                        }
                        
                        setTimeout(() => {
                            try {
                                connection.destroy();
                                console.log(`👋 ${guildId} için bot ses kanalından ayrıldı (5 dakika inaktif)`);
                                queueManager.clearQueueState(guildId);
                            } catch (error) {
                                console.error('Bağlantı kapatma hatası:', error);
                            }
                        }, 1000);
                    } catch (error) {
                        console.error('Mesaj gönderme veya bağlantı kapatma hatası:', error);
                        connection.destroy();
                        queueManager.clearQueueState(guildId);
                    }
                }
            }
        } catch (error) {
            console.error('Disconnect checker hatası:', error);
        }
    }, 30 * 1000);
}

// Kanaldan manuel çıkma fonksiyonu
export const leaveVoiceChannel = (guildId) => {
    try {
        queueManager.clearQueueState(guildId);
        
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