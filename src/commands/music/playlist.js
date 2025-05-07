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
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Hata')
                            .setDescription('Bu geçerli bir playlist değil!')
                            .setColor('#FF0000');
                        return await interaction.followUp({ embeds: [errorEmbed] });
                    }

                    const successEmbed = new EmbedBuilder()
                        .setTitle('🎵 Playlist Eklendi')
                        .setDescription(`**${playlist.title}** playlistinden **${playlist.tracks.length}** şarkı sıraya eklendi!`)
                        .setColor('#00FF00')
                        .setThumbnail(playlist.thumbnail || null)
                        .addFields(
                            { name: '👤 Oluşturan', value: playlist.author?.toString() || 'Bilinmiyor', inline: true },
                            { name: '🎵 Toplam Şarkı', value: playlist.tracks.length.toString(), inline: true }
                        );

                    return await interaction.followUp({ embeds: [successEmbed] });
                } catch (error) {
                    console.error('Playlist çalma hatası:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription(`Playlist yüklenirken bir hata oluştu: ${error.message}`)
                        .setColor('#FF0000');
                    return await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                }
            } else if (subcommand === 'info') {
                try {
                    const result = await player.search(url);
                    
                    if (!result.playlist) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ Hata')
                            .setDescription('Bu geçerli bir playlist değil!')
                            .setColor('#FF0000');
                        return await interaction.followUp({ embeds: [errorEmbed] });
                    }

                    const playlist = result.playlist;
                    const tracks = playlist.tracks.slice(0, 10);

                    const embed = new EmbedBuilder()
                        .setTitle(`📑 ${playlist.title}`)
                        .setDescription(
                            tracks.map((track, i) => `${i + 1}. **${track.title}**`).join('\n') +
                            (playlist.tracks.length > 10 ? `\n\n...ve ${playlist.tracks.length - 10} şarkı daha` : '')
                        )
                        .setColor('#FF0000')
                        .setThumbnail(playlist.thumbnail || null)
                        .addFields(
                            { name: '👤 Oluşturan', value: playlist.author?.toString() || 'Bilinmiyor', inline: true },
                            { name: '🎵 Toplam Şarkı', value: playlist.tracks.length.toString(), inline: true }
                        );

                    await interaction.followUp({ embeds: [embed] });
                } catch (error) {
                    console.error('Playlist bilgi hatası:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription(`Playlist bilgisi alınırken bir hata oluştu: ${error.message}`)
                        .setColor('#FF0000');
                    return await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Genel playlist hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 