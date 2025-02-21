import { ActivityType } from 'discord.js';
import { getPlayer } from '../utils/player.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`${client.user.tag} olarak giriş yapıldı!`);
            
            // Player'ı başlat
            await getPlayer(client);

            // Bot status'unu ayarla
            client.user.setPresence({
                activities: [{ 
                    name: '/help', 
                    type: ActivityType.Listening 
                }],
                status: 'online'
            });

        } catch (error) {
            console.error('Ready event hatası:', error);
        }
    }
};
