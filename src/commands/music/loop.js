import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { hasDjRole } from './dj.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Döngü modunu değiştirir')
        .addStringOption(option =>
            option.setName('mod')
                .setDescription('Döngü modu')
                .setRequired(true)
                .addChoices(
                    { name: 'Kapalı', value: '0' },
                    { name: 'Şarkı', value: '1' },
                    { name: 'Sıra', value: '2' }
                )),

    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Ses Kanalı Gerekli')
                    .setDescription('Önce bir ses kanalına katılmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!hasDjRole(interaction.member)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Yetki Gerekli')
                    .setDescription('Bu komutu kullanmak için DJ rolüne sahip olmalısın!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const player = interaction.client.manager.get(interaction.guild.id);

            if (!player) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const mode = parseInt(interaction.options.getString('mod'));
            
            switch (mode) {
                case 0: // Kapalı
                    player.setTrackRepeat(false);
                    player.setQueueRepeat(false);
                    break;
                case 1: // Şarkı
                    player.setTrackRepeat(true);
                    player.setQueueRepeat(false);
                    break;
                case 2: // Sıra
                    player.setTrackRepeat(false);
                    player.setQueueRepeat(true);
                    break;
            }

            const modeText = mode === 0 ? 'Kapalı' : mode === 1 ? 'Şarkı' : 'Sıra';
            const embed = new EmbedBuilder()
                .setTitle('🔄 Döngü Modu Değiştirildi')
                .setDescription(`Döngü modu **${modeText}** olarak ayarlandı!`)
                .setColor('#00FF00');
            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Loop komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 