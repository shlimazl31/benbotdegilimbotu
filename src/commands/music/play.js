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
                return await interaction.editReply({
                    content: '❌ Bir ses kanalında olmalısın!',
                    ephemeral: true
                });
            }

            const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return await interaction.editReply({
                    content: '❌ Ses kanalına katılmak ve konuşmak için izinlerim yok!',
                    ephemeral: true
                });
            }

            const query = interaction.options.getString('şarkı');
            
            let player = interaction.client.manager.get(interaction.guild.id);
            
            if (!player) {
                player = interaction.client.manager.create({
                    guild: interaction.guild.id,
                    voiceChannel: interaction.member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    selfDeafen: true,
                });
            }

            player.setVolume(20);

            const res = await player.search(query, interaction.user);
            
            if (!res || !res.tracks.length) {
                return await interaction.editReply({
                    content: '❌ Şarkı bulunamadı!',
                    ephemeral: true
                });
            }

            if (res.loadType === 'PLAYLIST_LOADED') {
                player.queue.add(res.tracks);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🎵 Playlist Eklendi')
                            .setDescription(`**${res.playlist.name}** playlistinden **${res.tracks.length}** şarkı sıraya eklendi!`)
                            .setColor('#00FF00')
                            .setThumbnail(res.tracks[0].thumbnail)
                            .addFields(
                                { name: '👤 Oluşturan', value: res.playlist.author || 'Bilinmiyor', inline: true },
                                { name: '🎵 Toplam Şarkı', value: res.tracks.length.toString(), inline: true },
                                { name: '🔊 Ses Seviyesi', value: '20%', inline: true }
                            )
                    ]
                });
            } else {
                player.queue.add(res.tracks[0]);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🎵 Şarkı Eklendi')
                            .setDescription(`**${res.tracks[0].title}** kuyruğa eklendi!`)
                            .setColor('#00FF00')
                            .setThumbnail(res.tracks[0].thumbnail)
                            .addFields(
                                { name: '🎤 Sanatçı', value: res.tracks[0].author, inline: true },
                                { name: '⏱️ Süre', value: res.tracks[0].duration, inline: true },
                                { name: '🔊 Ses Seviyesi', value: '20%', inline: true }
                            )
                            .setFooter({ text: `İsteyen: ${interaction.user.tag}` })
                    ]
                });
            }

            if (!player.playing && !player.paused && !player.queue.size) {
                player.play();
            }
        } catch (error) {
            console.error('Play komutu hatası:', error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: `❌ Bir hata oluştu: ${error.message}`,
                        ephemeral: true
                    });
                } else {
                    await interaction.editReply({
                        content: `❌ Bir hata oluştu: ${error.message}`,
                        ephemeral: true
                    });
                }
            } catch (err) {
                console.error('Hata mesajı gönderilirken ikinci bir hata oluştu:', err);
            }
        }
    }
};