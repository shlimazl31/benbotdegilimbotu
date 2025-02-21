import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { QueryType } from 'discord-player';

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
                if (!queue || !queue.connection) {
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

                    // Ses kanalına bağlan
                    if (!queue.connection) {
                        await queue.connect(voiceChannel);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Bağlantı için bekle
                    }
                }

                console.log('Şarkı aranıyor:', query);
                const result = await player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });

                if (!result.hasTracks()) {
                    return await interaction.followUp('Şarkı bulunamadı!');
                }

                console.log('Şarkı bulundu:', result.tracks[0].title);
                const track = result.tracks[0];

                // Şarkıyı çal
                try {
                    await queue.node.play(track);
                    console.log('Şarkı çalmaya başladı');
                    return await interaction.followUp(`🎵 Sıraya eklendi: **${track.title}**`);
                } catch (playError) {
                    console.error('Şarkı çalma hatası:', playError);
                    return await interaction.followUp(`Şarkı çalınırken hata oluştu: ${playError.message}`);
                }
            } catch (error) {
                console.error('Queue hatası:', error);
                return await interaction.followUp(`Bir hata oluştu: ${error.message}`);
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu!');
        }
    }
};