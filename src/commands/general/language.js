import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setGuildLanguage, translate } from '../../utils/language.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Bot dilini değiştirir')
        .addStringOption(option =>
            option.setName('dil')
                .setDescription('Yeni dil')
                .setRequired(true)
                .addChoices(
                    { name: '🇹🇷 Türkçe', value: 'tr' },
                    { name: '🇬🇧 English', value: 'en' },
                    { name: '🇩🇪 Deutsch', value: 'de' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const newLanguage = interaction.options.getString('dil');
        
        try {
            setGuildLanguage(interaction.guildId, newLanguage);
            await interaction.reply(translate('messages.languageChanged', interaction.guildId));
        } catch (error) {
            console.error('Language hatası:', error);
            await interaction.reply({
                content: translate('errors.generalError', interaction.guildId),
                ephemeral: true
            });
        }
    }
};