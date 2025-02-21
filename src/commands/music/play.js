import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { webcrypto } from 'node:crypto';
import { QueryType } from 'discord-player';

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

            // Bot'un izinlerini kontrol et
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return await interaction.reply('Ses kanalına katılmak ve konuşmak için iznim yok!');
            }

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı');

            try {
                // Önce mevcut queue'yu kontrol et
                let queue = player.nodes.get(interaction.guildId);
                
                // Queue yoksa yeni oluştur
                if (!queue) {
                    queue = player.nodes.create(interaction.guild, {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild.members.me,
                            requestedBy: interaction.user,
                        },
                        selfDeaf: true,
                        volume: 80,
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        leaveOnStop: false,
                        bufferingTimeout: 15000,
                        connectionTimeout: 999_999
                    });
                }

                // Ses kanalına bağlan
                if (!queue.connection) {
                    await queue.connect(voiceChannel);
                }

                // Şarkıyı ara ve çal
                const result = await player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });

                if (!result.hasTracks()) {
                    return await interaction.followUp('Şarkı bulunamadı!');
                }

                // Şarkıyı çal
                await queue.node.play(result.tracks[0]);

                return await interaction.followUp(`🎵 Sıraya eklendi: **${result.tracks[0].title}**`);
            } catch (error) {
                console.error('Çalma hatası:', error);
                
                // Hata durumunda queue'yu temizle
                if (player.nodes.get(interaction.guildId)) {
                    player.nodes.delete(interaction.guildId);
                }
                
                return await interaction.followUp('Şarkı çalınırken bir hata oluştu! Hata: ' + error.message);
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu! Hata: ' + error.message);
        }
    }
};