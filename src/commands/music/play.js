import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Bir şarkı çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya URL')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            if (!interaction.member.voice.channel) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Bir ses kanalında olmalısın!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Ses kanalına katılmak ve konuşmak için izinlerim yok!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const query = interaction.options.getString('şarkı');
            const player = interaction.client.manager.create({
                guild: interaction.guild.id,
                voiceChannel: interaction.member.voice.channel.id,
                textChannel: interaction.channel.id,
                selfDeafen: true,
            });

            player.setVolume(20);

            const res = await player.search(query, interaction.user);
            if (!res || !res.tracks.length) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şarkı bulunamadı!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (res.loadType === 'PLAYLIST_LOADED') {
                player.queue.add(res.tracks);
                const successEmbed = new EmbedBuilder()
                    .setTitle('🎵 Playlist Eklendi')
                    .setDescription(`**${res.playlist.name}** playlistinden **${res.tracks.length}** şarkı sıraya eklendi!`)
                    .setColor('#00FF00')
                    .setThumbnail(res.tracks[0].thumbnail)
                    .addFields(
                        { name: '👤 Oluşturan', value: res.playlist.author || 'Bilinmiyor', inline: true },
                        { name: '🎵 Toplam Şarkı', value: res.tracks.length.toString(), inline: true },
                        { name: '🔊 Ses Seviyesi', value: '20%', inline: true }
                    );
                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                player.queue.add(res.tracks[0]);
                const successEmbed = new EmbedBuilder()
                    .setTitle('🎵 Şarkı Eklendi')
                    .setDescription(`**${res.tracks[0].title}** kuyruğa eklendi!`)
                    .setColor('#00FF00')
                    .setThumbnail(res.tracks[0].thumbnail)
                    .addFields(
                        { name: '🎤 Sanatçı', value: res.tracks[0].author, inline: true },
                        { name: '⏱️ Süre', value: res.tracks[0].duration, inline: true },
                        { name: '🔊 Ses Seviyesi', value: '20%', inline: true }
                    )
                    .setFooter({ text: `İsteyen: ${interaction.user.tag}` });
                await interaction.editReply({ embeds: [successEmbed] });
            }

            if (!player.playing && !player.paused && !player.queue.size) {
                player.play();
            }
        } catch (error) {
            console.error('Şarkı çalma hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription(`Şarkı çalınırken bir hata oluştu: ${error.message}`)
                .setColor('#FF0000');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};