import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('YouTube\'da şarkı arar')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Aranacak şarkı')
                .setRequired(true)),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const query = interaction.options.getString('query');
            const player = await getPlayer(interaction.client);
            
            await interaction.deferReply();

            const searchResult = await player.search(query, {
                searchEngine: 'youtube'
            });

            if (!searchResult || !searchResult.hasTracks()) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sonuç Bulunamadı')
                    .setDescription(`"${query}" için sonuç bulunamadı!`)
                    .setColor('#FF0000');
                return await interaction.followUp({ embeds: [embed], ephemeral: true });
            }

            const tracks = searchResult.tracks.slice(0, 10);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('search-select')
                .setPlaceholder('Bir şarkı seçin')
                .addOptions(tracks.map((track, index) => ({
                    label: track.title.length > 100 ? track.title.substring(0, 97) + '...' : track.title,
                    description: track.author,
                    value: index.toString()
                })));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('🔍 Arama Sonuçları')
                .setDescription(`"${query}" için bulunan sonuçlar:`)
                .addFields(
                    tracks.map((track, index) => ({
                        name: `${index + 1}. ${track.title}`,
                        value: `👤 ${track.author} | ⏱️ ${track.duration}`
                    }))
                )
                .setColor('#00FF00')
                .setFooter({ text: 'Bir şarkı seçmek için aşağıdaki menüyü kullanın' });

            const message = await interaction.followUp({
                embeds: [embed],
                components: [row]
            });

            const collector = message.createMessageComponentCollector({
                time: 30000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return await i.reply({
                        content: '❌ Bu menüyü sadece komutu kullanan kişi kullanabilir!',
                        ephemeral: true
                    });
                }

                const selectedTrack = tracks[parseInt(i.values[0])];
                const channel = interaction.member.voice.channel;

                try {
                    await player.play(channel, selectedTrack, {
                        nodeOptions: {
                            metadata: interaction.channel,
                            volume: 80,
                            leaveOnEmpty: false,
                            leaveOnEnd: false
                        }
                    });

                    const successEmbed = new EmbedBuilder()
                        .setTitle('🎵 Şarkı Eklendi')
                        .setDescription(`**${selectedTrack.title}** sıraya eklendi!`)
                        .addFields(
                            { name: '👤 Sanatçı', value: selectedTrack.author, inline: true },
                            { name: '⏱️ Süre', value: selectedTrack.duration, inline: true }
                        )
                        .setThumbnail(selectedTrack.thumbnail)
                        .setColor('#00FF00');

                    await i.update({ embeds: [successEmbed], components: [] });
                } catch (error) {
                    console.error('Şarkı çalma hatası:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ Hata')
                        .setDescription('Şarkı çalınırken bir hata oluştu!')
                        .setColor('#FF0000');
                    await i.update({ embeds: [errorEmbed], components: [] });
                }
            });

            collector.on('end', async () => {
                if (!message.deleted) {
                    await message.edit({ components: [] }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('Search komutu hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 