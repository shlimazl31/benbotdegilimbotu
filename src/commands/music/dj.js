import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayer } from '../../utils/player.js';

// DJ rolü ayarlarını tutacak Map
const djRoles = new Map();

export const command = {
    data: new SlashCommandBuilder()
        .setName('dj')
        .setDescription('DJ rolü yönetimi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ayarla')
                .setDescription('DJ rolünü ayarlar')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('DJ rolü olarak ayarlanacak rol')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kaldır')
                .setDescription('DJ rolünü kaldırır'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bilgi')
                .setDescription('DJ rolü bilgilerini gösterir')),

    async execute(interaction) {
        try {
            // Sadece yöneticiler kullanabilsin
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ Bu komutu sadece yöneticiler kullanabilir!',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'ayarla': {
                    const role = interaction.options.getRole('rol');
                    djRoles.set(interaction.guildId, role.id);

                    const embed = new EmbedBuilder()
                        .setTitle('✅ DJ Rolü Ayarlandı')
                        .setDescription(`DJ rolü olarak **${role.name}** ayarlandı.`)
                        .setColor('#00FF00');

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'kaldır': {
                    const hadRole = djRoles.delete(interaction.guildId);

                    const embed = new EmbedBuilder()
                        .setTitle(hadRole ? '✅ DJ Rolü Kaldırıldı' : 'ℹ️ DJ Rolü Zaten Yok')
                        .setDescription(hadRole 
                            ? 'DJ rolü başarıyla kaldırıldı.' 
                            : 'Bu sunucuda ayarlanmış bir DJ rolü yok.')
                        .setColor(hadRole ? '#00FF00' : '#FFFF00');

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'bilgi': {
                    const roleId = djRoles.get(interaction.guildId);
                    const role = roleId ? interaction.guild.roles.cache.get(roleId) : null;

                    const embed = new EmbedBuilder()
                        .setTitle('ℹ️ DJ Rolü Bilgileri')
                        .setDescription(role 
                            ? `Mevcut DJ rolü: **${role.name}**` 
                            : 'Bu sunucuda ayarlanmış bir DJ rolü yok.')
                        .addFields(
                            { 
                                name: '📝 DJ Rolü Ne İşe Yarar?', 
                                value: 'DJ rolüne sahip kullanıcılar müzik komutlarını kullanabilir ve müzik sırasını yönetebilir.' 
                            },
                            { 
                                name: '🔒 Güvenlik', 
                                value: 'DJ rolü olmayan kullanıcılar sadece şarkı ekleyebilir, sırayı yönetemez.' 
                            }
                        )
                        .setColor(role ? '#00FF00' : '#FFFF00');

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('DJ komutu hatası:', error);
            await interaction.reply({
                content: '❌ Bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};

// DJ rolü kontrolü için yardımcı fonksiyon
export const hasDjRole = (member) => {
    const roleId = djRoles.get(member.guild.id);
    if (!roleId) return true; // DJ rolü ayarlanmamışsa herkes kullanabilsin
    return member.roles.cache.has(roleId) || member.permissions.has('Administrator');
}; 