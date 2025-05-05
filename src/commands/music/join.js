import { SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection } from '@discordjs/voice';

export const command = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Ses kanalına katılır'),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                return await interaction.reply({
                    content: '❌ Bu komut sadece sunucularda kullanılabilir!',
                    ephemeral: true
                });
            }

            if (!interaction.member.voice.channel) {
                return await interaction.reply({
                    content: '❌ Ses kanalına katılmak için bir ses kanalında olmalısınız!',
                    ephemeral: true
                });
            }

            // Zaten bir ses kanalında olup olmadığımızı kontrol et
            const existingConnection = getVoiceConnection(interaction.guild.id);
            if (existingConnection) {
                return await interaction.reply({
                    content: '❌ Zaten bir ses kanalındayım!',
                    ephemeral: true
                });
            }

            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            try {
                // Bağlantının hazır olmasını bekle
                await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
                
                // Bağlantı koptuğunda otomatik yeniden bağlanma
                connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                    try {
                        await Promise.race([
                            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                        // Yeni kanala bağlanıyor gibi görünüyor - bağlantıyı yok etme
                    } catch (error) {
                        // Gerçek bir bağlantı kopması - bağlantıyı yok et
                        connection.destroy();
                    }
                });

                return await interaction.reply('👋 Ses kanalına katıldım!');
            } catch (error) {
                console.error('Ses kanalına katılma hatası:', error);
                connection.destroy();
                return await interaction.reply({
                    content: `❌ Ses kanalına katılırken bir hata oluştu: ${error.message}`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Join komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};