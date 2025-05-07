import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Playlist komutları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Bir playlist\'i çalar')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('Playlist URL\'si')
                        .setRequired(true))),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const channel = interaction.member.voice.channel;

            if (!channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await interaction.deferReply();

            const subcommand = interaction.options.getSubcommand();
            const url = interaction.options.getString('url');

            if (subcommand === 'playlist-play') {
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
                        const embed = new EmbedBuilder()
                            .setTitle('❌ Geçersiz Playlist')
                            .setDescription('Bu geçerli bir playlist değil!')
                            .setColor('#FF0000');
                        return await interaction.followUp({ embeds: [embed], ephemeral: true });
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🎵 Playlist Eklendi')
                        .setDescription(`**${playlist.title}** playlistinden **${playlist.tracks.length}** şarkı sıraya eklendi!`)
                        .addFields(
                            { name: '📋 Playlist Adı', value: playlist.title, inline: true },
                            { name: '🎵 Şarkı Sayısı', value: playlist.tracks.length.toString(), inline: true }
                        )
                        .setThumbnail(playlist.thumbnail)
                        .setColor('#00FF00');
                    return await interaction.followUp({ embeds: [embed] });
                } catch (error) {
                    console.error('Playlist çalma hatası:', error);
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription(`Playlist yüklenirken bir hata oluştu: ${error.message}`)
                        .setColor('#FF0000');
                    return await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Playlist komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    }
}; 