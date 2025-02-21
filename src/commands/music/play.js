import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { QueryType } from 'discord-player';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya link')
                .setRequired(true)),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return await interaction.reply('Önce bir ses kanalına katılmalısın!');
            }

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı');

            const queue = player.nodes.create(interaction.guild, {
                metadata: interaction.channel,
                bufferingTimeout: 3000,
                volume: 100,
                leaveOnEmpty: false,
                leaveOnEnd: false,
            });

            if (!queue.connection) {
                await queue.connect(interaction.member.voice.channel);
            }

            const result = await player.search(query, {
                requestedBy: interaction.user,
            });

            // Debug için result yapısını kontrol et
            console.log('Arama sonucu:', {
                hasItems: !!result.items,
                itemCount: result.items?.length,
                firstItem: result.items?.[0],
            });

            if (!result.items?.length) {
                return interaction.followUp('Sonuç bulunamadı!');
            }

            const song = result.items[0];
            queue.addTrack(song);

            if (!queue.isPlaying()) {
                await queue.node.play();
            }

            return await interaction.followUp(`🎵 **${song.title}** sıraya eklendi!\n🔗 ${song.url || song.id}`);

        } catch (error) {
            console.error('Play komutu hatası:', error);
            return await interaction.followUp('Bir hata oluştu! Hata detayı: ' + error.message);
        }
    }
};