import { REST, Routes } from 'discord.js';

export const event = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
    }
};
