import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';
import { hasDjRole } from './dj.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Şarkının belirli bir süresine atlar')
        .addIntegerOption(option =>
            option.setName('saniye')
                .setDescription('Atlanacak süre (saniye)')
                .setRequired(true)
                .setMinValue(0)),

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

            if (!queue || !queue.isPlaying()) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şarkı Çalmıyor')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const seconds = interaction.options.getInteger('saniye');
            const duration = queue.currentTrack.durationMS / 1000;

            if (seconds > duration) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Geçersiz Süre')
                    .setDescription(`Şarkı süresi ${Math.floor(duration)} saniye!`)
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await queue.node.seek(seconds * 1000);
            const embed = new EmbedBuilder()
                .setTitle('⏩ Süre Atlatıldı')
                .setDescription(`Şarkı ${seconds}. saniyeye atlatıldı!`)
                .setColor('#00FF00');
            return await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Seek komutu hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}; 