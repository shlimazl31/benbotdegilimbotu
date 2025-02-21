import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Playlist işlemleri')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Bir playlist çalar')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Playlist URL (YouTube/Spotify)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Playlist bilgilerini gösterir')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Playlist URL')
                        .setRequired(true))),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const channel = interaction.member.voice.channel;

            if (!channel) {
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const subcommand = interaction.options.getSubcommand();
            const url = interaction.options.getString('url');

            if (subcommand === 'play') {
                try {
                    const { track, queue } = await player.play(channel, url, {
                        nodeOptions: {
                            metadata: interaction.channel,
                            bufferingTimeout: 3000,
                            leaveOnEmpty: false,
                            leaveOnEnd: false
                        }
                    });

                    const playlist = track.playlist;
                    if (!playlist) {
                        return await interaction.followUp('❌ Bu geçerli bir playlist değil!');
                    }

                    return await interaction.followUp(
                        `🎵 **${playlist.title}** playlistinden **${playlist.tracks.length}** şarkı sıraya eklendi!`
                    );
                } catch (error) {
                    console.error('Playlist çalma hatası:', error);
                    return await interaction.followUp({
                        content: `❌ Playlist yüklenirken bir hata oluştu: ${error.message}`,
                        ephemeral: true
                    });
                }
            } else if (subcommand === 'info') {
                try {
                    const result = await player.search(url);
                    
                    if (!result.playlist) {
                        return await interaction.followUp('❌ Bu geçerli bir playlist değil!');
                    }

                    const playlist = result.playlist;
                    const tracks = playlist.tracks.slice(0, 10);

                    const embed = new EmbedBuilder()
                        .setTitle(`📑 ${playlist.title}`)
                        .setDescription(
                            tracks.map((track, i) => `${i + 1}. **${track.title}**`).join('\n') +
                            (playlist.tracks.length > 10 ? `\n\n...ve ${playlist.tracks.length - 10} şarkı daha` : '')
                        )
                        .addFields(
                            { name: '👤 Oluşturan', value: playlist.author, inline: true },
                            { name: '🎵 Toplam Şarkı', value: playlist.tracks.length.toString(), inline: true }
                        )
                        .setThumbnail(playlist.thumbnail)
                        .setColor('#FF0000');

                    await interaction.followUp({ embeds: [embed] });
                } catch (error) {
                    console.error('Playlist bilgi hatası:', error);
                    return await interaction.followUp({
                        content: `❌ Playlist bilgisi alınırken bir hata oluştu: ${error.message}`,
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error('Genel playlist hatası:', error);
            return await interaction.followUp({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 