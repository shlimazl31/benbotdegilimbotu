import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Müzik sırasını gösterir'),

    async execute(interaction) {
        try {
            const player = interaction.client.manager.get(interaction.guild.id);

            if (!player) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const queue = player.queue;
            const currentTrack = queue.current;

            if (!currentTrack) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Şu Anda Şarkı Yok')
                    .setDescription('Şu anda çalan bir şarkı yok!')
                    .setColor('#FF0000');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const tracks = queue.slice(0, 10);
            const description = tracks.map((track, i) => `${i + 1}. **${track.title}** - ${track.author}`).join('\n');

            const embed = new EmbedBuilder()
                .setTitle('🎵 Müzik Sırası')
                .setDescription(description)
                .setColor('#1976D2')
                .addFields(
                    { name: '🎵 Şu An Çalıyor', value: `**${currentTrack.title}** - ${currentTrack.author}`, inline: false },
                    { name: '📊 Sıra Durumu', value: `${queue.size} şarkı sırada`, inline: true },
                    { name: '🔁 Tekrar Modu', value: player.queueRepeat ? 'Açık' : 'Kapalı', inline: true }
                )
                .setFooter({ text: `Sayfa 1/${Math.ceil(queue.size / 10)}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Queue hatası:', error);
            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('Bir hata oluştu!')
                .setColor('#FF0000');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
