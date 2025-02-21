import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

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

            const player = await getPlayer(interaction.client);
            const query = interaction.options.getString('şarkı', true);

            try {
                const { track } = await player.play(channel, query, {
                    nodeOptions: {
                        metadata: interaction.channel,
                        leaveOnEmpty: false,
                        leaveOnEnd: false
                    }
                });

                return interaction.followUp(`🎵 **${track.title}** sıraya eklendi!`);
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