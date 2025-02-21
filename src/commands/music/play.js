import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { webcrypto } from 'node:crypto';

// Node 18+ için crypto polyfill
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya YouTube linki')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const voiceChannel = interaction.member.voice.channel;
            
            if (!voiceChannel) {
                return await interaction.reply('Önce bir ses kanalına katılmalısın!');
            }

            // Bot'un ses kanalına katılma iznini kontrol et
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return await interaction.reply('Ses kanalına katılmak ve konuşmak için iznim yok!');
            }

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı');

            const searchResult = await player.search(query, {
                requestedBy: interaction.user
            });

            if (!searchResult.hasTracks()) {
                return await interaction.followUp('Şarkı bulunamadı!');
            }

            try {
                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user,
                    },
                    selfDeaf: true,
                    volume: 80,
                    leaveOnEmpty: false, // Kanal boş kalınca çıkmasın
                    leaveOnEnd: false, // Şarkı bitince çıkmasın
                    leaveOnStop: false, // Stop komutu verilince çıkmasın
                });

                // Ses kanalına katıl
                if (!queue.connection) {
                    await queue.connect(voiceChannel);
                }

                // Şarkıyı sıraya ekle ve çal
                await queue.play(searchResult.tracks[0]);
                
                return await interaction.followUp(`🎵 Çalınıyor: **${searchResult.tracks[0].title}**`);
            } catch (error) {
                console.error('Çalma hatası:', error);
                // Hata durumunda queue'yu temizle
                if (player.nodes.get(interaction.guildId)) {
                    player.nodes.delete(interaction.guildId);
                }
                return await interaction.followUp('Şarkı çalınırken bir hata oluştu!');
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu!');
        }
    }
};