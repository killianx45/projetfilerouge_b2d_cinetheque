const mongoose = require("mongoose");
const fs = require("fs");
const xlsx = require("xlsx");
const axios = require("axios");
require("dotenv").config();

API_KEY_TMDB = process.env.API_KEY_TMDB;
MONGO_URI_TEST = process.env.MONGO_URI_TEST;

const filmSchema = new mongoose.Schema({
  _id: String,
  titre: String,
  titre_original: String,
  realisateurs: String,
  annee_de_production: Number,
  nationalite: String,
  duree: String,
  genre: String,
  synopsis: String,
  posterPath: String,
  trailerPath: String,
  votePath: Number, // Ajout de la propriété votePath pour stocker vote_average
});

const Film = mongoose.model("Film", filmSchema);

mongoose.connect(MONGO_URI_TEST);

const filePath = "./film.xlsx";

const getPosterPath = async (title, originalTitle) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY_TMDB}&query=${
        originalTitle || title
      }`
    );
    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].poster_path;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du poster:", error.message);
  }
  return null;
};

const getMovieDetails = async (title, originalTitle) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY_TMDB}&query=${
        originalTitle || title
      }`
    );
    if (response.data.results && response.data.results.length > 0) {
      const movieId = response.data.results[0].id;
      // Récupérer les détails du film à partir de son ID
      const movieDetailsResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY_TMDB}&append_to_response=videos`
      );
      if (movieDetailsResponse.data) {
        const trailer = movieDetailsResponse.data.videos.results.find(
          (video) => video.type === "Trailer" && video.site === "YouTube"
        );
        // Récupérer la valeur de vote_average
        const voteAverage = movieDetailsResponse.data.vote_average;
        if (trailer) {
          return {
            trailerKey: trailer.key,
            voteAverage: voteAverage,
          };
        }
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails du film:",
      error.message
    );
  }
  return null;
};

const getGenres = async () => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY_TMDB}`
    );
    if (response.data.genres) {
      return response.data.genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {});
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des genres:", error.message);
  }
  return null;
};

const syncData = async () => {
  try {
    const genresMap = await getGenres();

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const excelData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Nettoie la base de données en supprimant tous les documents existants
    await Film.deleteMany({ _id: { $exists: true, $ne: null } });

    for (const excelRow of excelData.slice(1)) {
      const filmId = excelRow[0];
      const annee_de_production = isNaN(excelRow[4])
        ? null
        : parseInt(excelRow[4]);

      const posterPath = await getPosterPath(excelRow[1]);
      const trailerVoteData = await getMovieDetails(excelRow[1]);
      const trailerPath = trailerVoteData ? trailerVoteData.trailerKey : null;
      const voteAverage = trailerVoteData ? trailerVoteData.voteAverage : null;

      let filmGenres = excelRow[7]; // Récupération des genres à partir de la feuille Excel
      if (!filmGenres) {
        // Si le genre est undefined, récupérer les genres depuis l'API TMDB
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY_TMDB}&query=${excelRow[1]}`
        );
        if (response.data.results && response.data.results.length > 0) {
          const genreIds = response.data.results[0].genre_ids;
          filmGenres = genreIds.map((id) => genresMap[id]).join(", "); // Utilisation de la map pour traduire les IDs en noms de genres
        }
      }

      const filmData = {
        _id: filmId,
        titre: excelRow[1],
        titre_original: excelRow[2],
        realisateurs: excelRow[3],
        annee_de_production,
        nationalite: excelRow[5],
        duree: excelRow[6],
        genre: filmGenres, // Utilisation des genres récupérés
        synopsis: excelRow.slice(8).join("\t"),
        posterPath,
        trailerPath,
        votePath: voteAverage, // Ajout de vote_average à votePath
      };

      // Vérifie s'il existe déjà un film avec le même ID
      const existingFilm = await Film.findOne({ _id: filmId });

      if (existingFilm) {
        // Met à jour le film existant dans la base
        await Film.updateOne({ _id: filmId }, { $set: filmData });
        console.log("Film mis à jour dans la base de données:", filmData);
      } else {
        // Ajoute le film à la base s'il n'existe pas encore
        await Film.create(filmData);
        console.log("Nouveau film ajouté à la base de données:", filmData);
      }
    }

    console.log("Synchronisation terminée.");
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Appelle la fonction de synchronisation au début du script
syncData();
