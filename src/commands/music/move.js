import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { hasDjRole } from './dj.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Sıradaki bir şarkının pozisyonunu değiştirir')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('Taşınacak şarkının mevcut pozisyonu')
                .setRequired(true)
                .setMinValue(1))
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('Taşınacak şarkının yeni pozisyonu')
                .setRequired(true)
                .setMinValue(1)),

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

            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue || !queue.tracks.size) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sıra Boş')
                    .setDescription('Sırada taşınacak şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const from = interaction.options.getInteger('from');
            const to = interaction.options.getInteger('to');

            if (from > queue.tracks.size || to > queue.tracks.size) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Geçersiz Pozisyon')
                    .setDescription(`Sırada sadece ${queue.tracks.size} şarkı var!`)
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const track = queue.tracks.at(from - 1);
            queue.tracks.splice(from - 1, 1);
            queue.tracks.splice(to - 1, 0, track);

            const embed = new EmbedBuilder()
                .setTitle('🔄 Şarkı Taşındı')
                .setDescription(`**${track.title}** şarkısı ${from}. pozisyondan ${to}. pozisyona taşındı!`)
                .setColor('#00FF00');
            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Move komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 