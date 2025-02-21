import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import os from 'os';

export const command = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Bot istatistiklerini gösterir'),

    async execute(interaction) {
        try {
            const client = interaction.client;
            const totalMemory = Math.round(os.totalmem() / 1024 / 1024);
            const freeMemory = Math.round(os.freemem() / 1024 / 1024);
            const usedMemory = totalMemory - freeMemory;

            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);

            const embed = new EmbedBuilder()
                .setTitle('📊 Bot İstatistikleri')
                .addFields(
                    { name: '🤖 Bot Bilgileri', value: 
                        `Sunucu Sayısı: ${client.guilds.cache.size}\n` +
                        `Kullanıcı Sayısı: ${client.users.cache.size}\n` +
                        `Ping: ${client.ws.ping}ms`
                    },
                    { name: '⚙️ Sistem Bilgileri', value:
                        `RAM Kullanımı: ${usedMemory}/${totalMemory}MB\n` +
                        `İşletim Sistemi: ${os.platform()}\n` +
                        `CPU: ${os.cpus()[0].model}`
                    },
                    { name: '⏰ Çalışma Süresi', value:
                        `${days} gün, ${hours} saat, ${minutes} dakika, ${seconds} saniye`
                    }
                )
                .setColor('#FF0000')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Stats komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 