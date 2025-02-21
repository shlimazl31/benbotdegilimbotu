import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';

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

            const player = useMainPlayer();
            const query = interaction.options.getString('şarkı');

            try {
                const { track } = await player.play(voiceChannel, query, {
                    nodeOptions: {
                        metadata: interaction,
                        volume: 80,
                        leaveOnEmpty: false,
                        leaveOnEnd: false
                    }
                });

                return await interaction.followUp(`🎵 Sıraya eklendi: **${track.title}**`);
            } catch (error) {
                console.error('Çalma hatası:', error);
                return await interaction.followUp('Şarkı çalınırken bir hata oluştu!');
            }
        } catch (error) {
            console.error('Genel hata:', error);
            return await interaction.followUp('Bir hata oluştu!');
        }
    }
};