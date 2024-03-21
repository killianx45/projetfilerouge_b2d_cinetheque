const mongoose = require("mongoose");

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

const FilmConnection = mongoose.createConnection(
  "mongodb://localhost:27017/films"
);
const FilmModel = FilmConnection.model("Film", filmSchema);

module.exports = FilmModel;
