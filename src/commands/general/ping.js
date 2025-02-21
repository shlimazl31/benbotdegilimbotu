import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Bot gecikmesini gösterir'),

    async execute(interaction) {
        try {
            const sent = await interaction.reply({ 
                content: 'Ping ölçülüyor...', 
                fetchReply: true 
            });

            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: 'Bot Gecikmesi', value: `${interaction.client.ws.ping}ms`, inline: true },
                    { name: 'API Gecikmesi', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`, inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('Ping komutu hatası:', error);
            return await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
}; 