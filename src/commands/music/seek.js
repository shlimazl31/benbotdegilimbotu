import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Şarkının belirli bir saniyesine atlar')
        .addIntegerOption(option =>
            option.setName('saniye')
                .setDescription('Atlanacak saniye')
                .setRequired(true)
                .setMinValue(0)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return await interaction.followUp({
                    content: '❌ Şu anda çalan bir şarkı yok!',
                    ephemeral: true
                });
            }

            const time = interaction.options.getInteger('saniye') * 1000; // milisaniyeye çevir
            await queue.node.seek(time);

            return await interaction.followUp(`⏩ **${time / 1000}** saniyeye atlandı!`);
        } catch (error) {
            console.error('Seek hatası:', error);
            return await interaction.followUp({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 