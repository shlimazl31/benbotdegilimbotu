import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';

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
            const channel = interaction.member.voice.channel;
            if (!channel) return interaction.reply('Önce bir ses kanalına katılmalısın!');

            await interaction.deferReply();

            const player = useMainPlayer();
            const query = interaction.options.getString('şarkı', true);

            try {
                const { track } = await player.play(channel, query, {
                    nodeOptions: {
                        metadata: interaction.channel,
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        volume: 100,
                        bufferingTimeout: 3000
                    }
                });

                return interaction.followUp(`🎵 **${track.title}** sıraya eklendi!\n🔗 ${track.url}`);
            } catch (error) {
                console.error('Çalma hatası:', error);
                return interaction.followUp(`❌ Bir hata oluştu: ${error.message}`);
            }

        } catch (error) {
            console.error('Genel hata:', error);
            return interaction.followUp('❌ Bir hata oluştu!');
        }
    }
};