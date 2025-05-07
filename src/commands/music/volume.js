import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { getGuildVolume, setGuildVolume } from '../../utils/settings.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Ses seviyesini ayarlar')
        .addIntegerOption(option =>
            option.setName('seviye')
                .setDescription('Ses seviyesi (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('❌ Şu anda çalan bir şarkı yok!');
                
                return await interaction.followUp({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
            }

            const volume = interaction.options.getInteger('seviye');
            queue.node.setVolume(volume);
            
            // Ses seviyesini kaydet
            setGuildVolume(interaction.guildId, volume);

            const volumeEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`🔊 Ses seviyesi **${volume}%** olarak ayarlandı!`)
                .setFooter({ text: `${interaction.user.tag} tarafından ayarlandı` })
                .setTimestamp();

            return await interaction.followUp({ embeds: [volumeEmbed] });
        } catch (error) {
            console.error('Volume hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('❌ Bir hata oluştu!');
            
            return await interaction.followUp({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
}; 