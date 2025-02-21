import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar')
        .addStringOption(option =>
            option.setName('şarkı')
                .setDescription('Şarkı adı veya YouTube linki')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const voiceChannel = interaction.member.voice.channel;
            
            if (!voiceChannel) {
                return await interaction.reply('Önce bir ses kanalına katılmalısın!');
            }

            await interaction.deferReply();

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı');

            try {
                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user,
                    },
                    selfDeaf: true,
                    volume: 80,
                    leaveOnEmpty: false,
                    leaveOnEnd: false
                });

                try {
                    if (!queue.connection) {
                        await queue.connect(voiceChannel);
                    }
                } catch (error) {
                    console.error('Bağlantı hatası:', error);
                    queue.delete();
                    return await interaction.followUp('Ses kanalına bağlanırken bir hata oluştu!');
                }

                const result = await player.search(query, {
                    requestedBy: interaction.user
                });

                if (!result.hasTracks()) {
                    return await interaction.followUp('Şarkı bulunamadı!');
                }

                try {
                    await queue.node.play(result.tracks[0]);
                    return await interaction.followUp(`🎵 Sıraya eklendi: **${result.tracks[0].title}**`);
                } catch (error) {
                    console.error('Çalma hatası:', error);
                    return await interaction.followUp('Şarkı çalınırken bir hata oluştu!');
                }
            } catch (error) {
                console.error('Queue hatası:', error);
                return await interaction.followUp('Bir hata oluştu!');
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu!');
        }
    }
};