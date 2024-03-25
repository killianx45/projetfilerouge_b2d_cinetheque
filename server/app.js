const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const MONGO_URI_TEST = process.env.MONGO_URI_TEST;

mongoose.connect(MONGO_URI_TEST);

const FilmSchema = new mongoose.Schema({
  titre: String,
  synopsis: String,
});

const Film = mongoose.model("Film", FilmSchema);

app.use(cors());

app.get("/films", (req, res) => {
  Film.find({}, (err, films) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).json(films);
    }
  });
});
