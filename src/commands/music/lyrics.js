import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import fetch from 'node-fetch';

export const command = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Çalan şarkının sözlerini gösterir'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.currentTrack) {
                return await interaction.reply({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            try {
                const songName = queue.currentTrack.title.replace(/ *\([^)]*\) */g, '').replace(/ *\[[^\]]*]/, '');
                const artist = queue.currentTrack.author;
                const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${songName}`);
                const data = await response.json();

                if (data.error || !data.lyrics) {
                    return await interaction.followUp('❌ Şarkı sözleri bulunamadı!');
                }

                const lyrics = data.lyrics.length > 4096 
                    ? data.lyrics.slice(0, 4093) + '...' 
                    : data.lyrics;

                const embed = new EmbedBuilder()
                    .setTitle(`📝 ${queue.currentTrack.title} - Şarkı Sözleri`)
                    .setDescription(lyrics)
                    .setColor('#FF0000')
                    .setFooter({ text: `${artist} - ${songName}` });

                return await interaction.followUp({ embeds: [embed] });
            } catch (error) {
                console.error('Lyrics API hatası:', error);
                return await interaction.followUp('❌ Şarkı sözleri alınırken bir hata oluştu!');
            }
        } catch (error) {
            console.error('Lyrics komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 