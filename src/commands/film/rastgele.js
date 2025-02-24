import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const command = {
    data: new SlashCommandBuilder()
        .setName('rastgelefilm')
        .setDescription('Rastgele bir film önerir')
        .addStringOption(option =>
            option
                .setName('tür')
                .setDescription('Film türü (opsiyonel)')
                .addChoices(
                    { name: 'Aksiyon', value: '28' },
                    { name: 'Macera', value: '12' },
                    { name: 'Animasyon', value: '16' },
                    { name: 'Komedi', value: '35' },
                    { name: 'Suç', value: '80' },
                    { name: 'Belgesel', value: '99' },
                    { name: 'Dram', value: '18' },
                    { name: 'Aile', value: '10751' },
                    { name: 'Fantastik', value: '14' },
                    { name: 'Tarih', value: '36' },
                    { name: 'Korku', value: '27' },
                    { name: 'Müzik', value: '10402' },
                    { name: 'Gizem', value: '9648' },
                    { name: 'Romantik', value: '10749' },
                    { name: 'Bilim Kurgu', value: '878' },
                    { name: 'TV Film', value: '10770' },
                    { name: 'Gerilim', value: '53' },
                    { name: 'Savaş', value: '10752' },
                    { name: 'Western', value: '37' },
                    { name: 'Politik', value: '10768' }
                )),

    async execute(interaction) {
        await interaction.deferReply();
        const tur = interaction.options.getString('tür');

        try {
            let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&language=tr-TR&sort_by=popularity.desc&include_adult=false&page=${Math.floor(Math.random() * 5) + 1}`;
            
            if (tur) {
                url += `&with_genres=${tur}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                return interaction.editReply('Film bulunamadı!');
            }

            const film = data.results[Math.floor(Math.random() * data.results.length)];

            const embed = new EmbedBuilder()
                .setTitle('🎲 Rastgele Film Önerisi: ' + film.title)
                .setDescription(film.overview || 'Açıklama bulunamadı.')
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Yayın Tarihi', value: film.release_date || 'Belirtilmemiş', inline: true },
                    { name: 'Puan', value: `⭐ ${film.vote_average}/10`, inline: true },
                    { name: 'Popülerlik', value: `📈 ${Math.round(film.popularity)}`, inline: true }
                );

            if (film.poster_path) {
                embed.setThumbnail(`https://image.tmdb.org/t/p/w500${film.poster_path}`);
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Rastgele film hatası:', error);
            await interaction.editReply('Film önerisi alınırken bir hata oluştu!');
        }
    },
}; 