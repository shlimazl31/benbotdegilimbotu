import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_TOKEN}`
    }
};

export const command = {
    data: new SlashCommandBuilder()
        .setName('film')
        .setDescription('Film arama ve bilgi komutları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ara')
                .setDescription('Film ara')
                .addStringOption(option =>
                    option
                        .setName('isim')
                        .setDescription('Aranacak film adı')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kategori')
                .setDescription('Kategoriye göre film ara')
                .addStringOption(option =>
                    option
                        .setName('tür')
                        .setDescription('Film türü')
                        .setRequired(true)
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
                        ))),

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'ara') {
            const filmAdi = interaction.options.getString('isim');
            console.log('Aranıyor:', filmAdi);
            console.log('API Key:', process.env.TMDB_API_KEY ? 'Mevcut' : 'Eksik');

            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(filmAdi)}&language=tr-TR`
                );
                
                const data = await response.json();
                console.log('API Yanıtı:', data);

                if (!data.results || data.results.length === 0) {
                    return interaction.editReply('Film bulunamadı!');
                }

                const film = data.results[0];
                const embed = new EmbedBuilder()
                    .setTitle(film.title)
                    .setDescription(film.overview || 'Açıklama bulunamadı.')
                    .setColor(0x00AE86)
                    .addFields(
                        { name: 'Yayın Tarihi', value: film.release_date || 'Belirtilmemiş', inline: true },
                        { name: 'Puan', value: `⭐ ${film.vote_average}/10`, inline: true },
                        { name: 'Popülerlik', value: film.popularity.toString(), inline: true }
                    );

                if (film.poster_path) {
                    embed.setThumbnail(`https://image.tmdb.org/t/p/w500${film.poster_path}`);
                }

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Film arama hatası:', error);
                await interaction.editReply('Film aranırken bir hata oluştu!');
            }
        } else if (subcommand === 'kategori') {
            const turId = interaction.options.getString('tür');
            const response = await fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${turId}&language=tr-TR&sort_by=popularity.desc`
            );
            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                return interaction.editReply('Bu kategoride film bulunamadı!');
            }

            const filmler = data.results.slice(0, 5);
            const embed = new EmbedBuilder()
                .setTitle('Kategori Filmleri')
                .setColor(0x00AE86);

            filmler.forEach((film, index) => {
                embed.addFields({
                    name: `${index + 1}. ${film.title}`,
                    value: `${film.overview ? film.overview.slice(0, 100) + '...' : 'Açıklama yok'}\n⭐ ${film.vote_average}/10`
                });
            });

            await interaction.editReply({ embeds: [embed] });
        }
    },
}; 