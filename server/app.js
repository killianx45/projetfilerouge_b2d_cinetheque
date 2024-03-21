const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const MONGO_URI_TEST = process.env.MONGO_URI_TEST;
// Connectez-vous à votre base de données MongoDB
mongoose.connect(MONGO_URI_TEST);

// Définissez le schéma et le modèle pour les films
const FilmSchema = new mongoose.Schema({
  titre: String,
  synopsis: String,
  // Ajoutez d'autres champs si nécessaire
});

const Film = mongoose.model("Film", FilmSchema);

// Utilisez le middleware CORS pour permettre les requêtes CORS
app.use(cors());

// Créez une route pour renvoyer tous les films
app.get("/films", (req, res) => {
  Film.find({}, (err, films) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).json(films);
    }
  });
});
