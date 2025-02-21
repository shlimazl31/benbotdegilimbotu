import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { QueryType } from 'discord-player';
import play from 'play-dl';

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

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı');

            try {
                // YouTube API'sini ayarla
                await play.setToken({
                    youtube: {
                        cookie: process.env.YOUTUBE_COOKIE || ''
                    }
                });

                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user,
                    },
                    selfDeaf: true,
                    volume: 80,
                    leaveOnEmpty: false,
                    leaveOnEnd: false
                });

                try {
                    if (!queue.connection) {
                        await queue.connect(voiceChannel);
                    }
                } catch (error) {
                    console.error('Bağlantı hatası:', error);
                    queue.delete();
                    return await interaction.followUp('Ses kanalına bağlanırken bir hata oluştu!');
                }

                // Şarkı araması yap
                const searchResult = await player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });

                console.log('Arama sonucu:', searchResult);

                if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                    if (queue) queue.delete();
                    return await interaction.followUp('Şarkı bulunamadı! Lütfen başka bir şarkı deneyin.');
                }

                try {
                    const track = searchResult.tracks[0];
                    await queue.node.play(track);
                    
                    return await interaction.followUp({
                        content: `🎵 Sıraya eklendi: **${track.title}**\n🔗 ${track.url}`
                    });
                } catch (error) {
                    console.error('Çalma hatası:', error);
                    if (queue) queue.delete();
                    return await interaction.followUp('Şarkı çalınırken bir hata oluştu!');
                }
            } catch (error) {
                console.error('Queue hatası:', error);
                return await interaction.followUp('Bir hata oluştu!');
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu!');
        }
    }
};