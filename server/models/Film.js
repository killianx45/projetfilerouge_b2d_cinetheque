const mongoose = require("mongoose");
require("dotenv").config();

const filmSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.Mixed, required: true },
  titre_original: String,
  realisateurs: String,
  annee_de_production: Number,
  nationalite: String,
  duree: String,
  genre: String,
  synopsis: String,
  posterPath: String,
  trailerPath: String,
  votePath: Number,
});
const FILM_CONNECTION = process.env.FILM_CONNECTION;
const FilmConnection = mongoose.createConnection(FILM_CONNECTION);
const FilmModel = FilmConnection.model("Film", filmSchema);

module.exports = FilmModel;
