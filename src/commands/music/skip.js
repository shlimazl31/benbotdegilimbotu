import { SlashCommandBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

const command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Çalan şarkıyı atlar'),

    async execute(interaction) {
        try {
            const player = await getPlayer(interaction.client);
            const queue = player.nodes.get(interaction.guildId);

            if (!queue) {
                return await interaction.reply('Şu anda çalan bir şarkı yok!');
            }

            if (!interaction.member.voice.channel) {
                return await interaction.reply('Bu komutu kullanmak için bir ses kanalında olmalısın!');
            }

            if (interaction.member.voice.channel.id !== queue.channel.id) {
                return await interaction.reply('Bu komutu kullanmak için botla aynı ses kanalında olmalısın!');
            }

            try {
                await queue.node.skip();
                await interaction.reply('⏭️ Şarkı atlandı!');
            } catch (error) {
                console.error('Skip hatası:', error);
                await interaction.reply('Şarkı atlanırken bir hata oluştu!');
            }
        } catch (error) {
            console.error('Genel skip hatası:', error);
            await interaction.reply('Bir hata oluştu!');
        }
    }
};

export { command };
