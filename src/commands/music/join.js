import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection } from '@discordjs/voice';

export const command = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Ses kanalına katılır'),

    async execute(interaction) {
        try {
            if (!interaction.guild) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sunucu Gerekli')
                    .setDescription('Bu komut sadece sunucularda kullanılabilir!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Ses kanalına katılmak için bir ses kanalında olmalısınız!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Zaten bir ses kanalında olup olmadığımızı kontrol et
            const existingConnection = getVoiceConnection(interaction.guild.id);
            if (existingConnection) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Zaten Bağlı')
                    .setDescription('Zaten bir ses kanalındayım!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
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

                const embed = new EmbedBuilder()
                    .setTitle('👋 Bağlantı Başarılı')
                    .setDescription('Ses kanalına başarıyla katıldım!')
                    .setColor('#00FF00');
                return await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Ses kanalına katılma hatası:', error);
                connection.destroy();
                const embed = new EmbedBuilder()
                    .setTitle('❌ Bağlantı Hatası')
                    .setDescription(`Ses kanalına katılırken bir hata oluştu: ${error.message}`)
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error('Join komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu.')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};