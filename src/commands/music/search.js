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
                return await interaction.reply({
                    content: '❌ Önce bir ses kanalına katılmalısın!',
                    ephemeral: true
                });
            }

            const query = interaction.options.getString('query');
            const player = await getPlayer(interaction.client);
            
            await interaction.deferReply();

            try {
                const results = await player.search(query);
                if (!results.tracks.length) {
                    return await interaction.followUp('❌ Sonuç bulunamadı!');
                }

                const tracks = results.tracks.slice(0, 10); // İlk 10 sonuç
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('song-select')
                    .setPlaceholder('Bir şarkı seç')
                    .addOptions(tracks.map((track, i) => ({
                        label: track.title.slice(0, 100),
                        description: track.author.slice(0, 100),
                        value: i.toString()
                    })));

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const embed = new EmbedBuilder()
                    .setTitle('🔍 Arama Sonuçları')
                    .setDescription(tracks.map((t, i) => `${i + 1}. ${t.title} - ${t.author}`).join('\n'))
                    .setColor('#FF0000');

                const response = await interaction.followUp({
                    embeds: [embed],
                    components: [row]
                });

                const collector = response.createMessageComponentCollector({
                    time: 30000 // 30 saniye
                });

                collector.on('collect', async i => {
                    if (i.user.id !== interaction.user.id) {
                        return await i.reply({
                            content: '❌ Bu menüyü sadece komutu kullanan kişi kullanabilir!',
                            ephemeral: true
                        });
                    }

                    const track = tracks[parseInt(i.values[0])];
                    await player.play(interaction.member.voice.channel, track, {
                        nodeOptions: {
                            metadata: interaction
                        }
                    });

                    await i.update({
                        content: `🎵 **${track.title}** sıraya eklendi!`,
                        embeds: [],
                        components: []
                    });
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        await interaction.editReply({
                            content: '❌ Süre doldu!',
                            embeds: [],
                            components: []
                        });
                    }
                });

            } catch (error) {
                console.error('Search hatası:', error);
                return await interaction.followUp({
                    content: '❌ Arama sırasında bir hata oluştu!',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Search komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 