import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getLyrics } from 'genius-lyrics-api';

export const command = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Şarkı sözlerini gösterir')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı (boş bırakılırsa çalan şarkının sözleri gösterilir)')),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);
            const query = interaction.options.getString('şarkı') || (queue?.currentTrack?.title);

            if (!query) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şarkı Bulunamadı')
                    .setDescription('Lütfen bir şarkı adı belirtin veya bir şarkı çalın!')
                    .setColor('#FF0000');
                return await interaction.followUp({ embeds: [embed], ephemeral: true });
            }

            const options = {
                apiKey: process.env.GENIUS_TOKEN,
                title: query,
                artist: queue?.currentTrack?.author || '',
                optimizeQuery: true
            };

            try {
                const lyrics = await getLyrics(options);

                if (!lyrics) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Sözler Bulunamadı')
                        .setDescription(`"${query}" için şarkı sözleri bulunamadı!`)
                        .setColor('#FF0000');
                    return await interaction.followUp({ embeds: [embed], ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`📜 ${query} Şarkı Sözleri`)
                    .setDescription(lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics)
                    .setColor('#00FF00')
                    .setFooter({ text: 'Kaynak: Genius' });

                return await interaction.followUp({ embeds: [embed] });
            } catch (error) {
                console.error('Lyrics arama hatası:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Hata')
                    .setDescription('Şarkı sözleri alınırken bir hata oluştu!')
                    .setColor('#FF0000');
                return await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error('Lyrics komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    }
}; 