import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const command = {
    data: new SlashCommandBuilder()
        .setName('filmdetay')
        .setDescription('Film hakkında detaylı bilgi verir')
        .addStringOption(option =>
            option
                .setName('isim')
                .setDescription('Film adı')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const filmAdi = interaction.options.getString('isim');

        try {
            // Film araması
            const searchResponse = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(filmAdi)}&language=tr-TR`
            );
            const searchData = await searchResponse.json();

            if (!searchData.results || searchData.results.length === 0) {
                return interaction.editReply('Film bulunamadı!');
            }

            // Detaylı film bilgisi
            const filmId = searchData.results[0].id;
            const detailResponse = await fetch(
                `https://api.themoviedb.org/3/movie/${filmId}?api_key=${process.env.TMDB_API_KEY}&language=tr-TR&append_to_response=credits,videos`
            );
            const film = await detailResponse.json();

            const embed = new EmbedBuilder()
                .setTitle(film.title)
                .setDescription(film.overview || 'Açıklama bulunamadı.')
                .setColor(0x00AE86)
                .addFields(
                    { name: '🎬 Yayın Tarihi', value: film.release_date || 'Belirtilmemiş', inline: true },
                    { name: '⭐ Puan', value: `${film.vote_average}/10`, inline: true },
                    { name: '⏱️ Süre', value: `${film.runtime} dakika`, inline: true },
                    { name: '🎭 Türler', value: film.genres.map(g => g.name).join(', ') || 'Belirtilmemiş' },
                    { name: '🎬 Yönetmen', value: film.credits.crew.find(c => c.job === 'Director')?.name || 'Belirtilmemiş' },
                    { name: '👥 Oyuncular', value: film.credits.cast.slice(0, 5).map(a => a.name).join(', ') || 'Belirtilmemiş' }
                );

            if (film.poster_path) {
                embed.setThumbnail(`https://image.tmdb.org/t/p/w500${film.poster_path}`);
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Film detay hatası:', error);
            await interaction.editReply('Film bilgileri alınırken bir hata oluştu!');
        }
    },
}; 