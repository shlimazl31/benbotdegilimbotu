import { ActivityType } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`${client.user.tag} olarak giriş yapıldı!`);
            
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
