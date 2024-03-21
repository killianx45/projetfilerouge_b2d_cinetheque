const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const FilmModel = require("./models/Film");
const axios = require("axios");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const TOKEN_KEY = process.env.TOKEN_KEY;
const PORT = process.env.PORT;

mongoose.connect(MONGO_URI);

// Ajoutez cette route après vos autres routes GET
app.get("/api/films/search", async (req, res) => {
  const { title } = req.query;
  try {
    // Recherchez les films qui contiennent le titre fourni dans leur titre
    const films = await FilmModel.find({
      titre: { $regex: title, $options: "i" },
    });
    res.json(films);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Une erreur est survenue lors de la recherche des films.",
    });
  }
});

app.get("/api/films", async (req, res) => {
  try {
    const films = await FilmModel.find();
    res.json(films);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des films.",
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const newPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({
      name: req.body.name,
      email: req.body.email,
      password: newPassword,
    });
    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "error", error: "Duplicate email" });
  }
});

app.post("/api/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  if (!user) {
    return res.json({ status: "error", user: false });
  }

  const isPasswordValid = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (isPasswordValid) {
    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
      },
      TOKEN_KEY
    );

    return res.json({ status: "ok", user: token });
  } else {
    return res.json({ status: "error", user: false });
  }
});

app.get("/api/user", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    res.json({
      name: userData.name,
      email: userData.email,
    });
  });
});

app.post("/api/user/like", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    const filmIdToAdd = req.body.filmId;

    // Check if the film is already liked by the user
    if (userData.likes.includes(filmIdToAdd)) {
      return res.json({ success: false, error: "Film already liked" });
    }

    // Add the film to the likes array
    userData.likes.push(filmIdToAdd);

    try {
      await userData.save();
    } catch (error) {
      console.error("Save error:", error);
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while saving" });
    }

    res.json({ success: true });
  });
});

app.post("/api/user/dislike", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    const filmIdToRemove = req.body.filmId;

    // Check if the film is already liked by the user
    if (!userData.likes.includes(filmIdToRemove)) {
      return res.json({ success: false, error: "Film not liked" });
    }

    // Remove the film from the likes array
    userData.likes = userData.likes.filter((id) => id !== filmIdToRemove);

    try {
      await userData.save();
    } catch (error) {
      console.error("Save error:", error);
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while saving" });
    }

    res.json({ success: true });
  });
});

app.post("/api/user/watch", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    const filmIdToAdd = req.body.filmId;

    // Check if the film is already watched by the user
    if (userData.watchlist.includes(filmIdToAdd)) {
      return res.json({
        success: false,
        error: "Le Film est dans votre watchlist",
      });
    }

    // Add the film to the watched array
    userData.watch.push(filmIdToAdd);

    try {
      await userData.save();
    } catch (error) {
      console.error("Save error:", error);
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while saving" });
    }

    res.json({ success: true });
  });
});

app.post("/api/user/unwatch", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    const filmIdToRemove = req.body.filmId;

    // Check if the film is already watched by the user
    if (!userData.watch.includes(filmIdToRemove)) {
      return res.json({ success: false, error: "Film not watched" });
    }

    // Remove the film from the watched array
    userData.watch = userData.watch.filter((id) => id !== filmIdToRemove);

    try {
      await userData.save();
    } catch (error) {
      console.error("Save error:", error);
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while saving" });
    }

    res.json({ success: true });
  });
});

app.post("/api/user/watchlist", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    const filmIdToAdd = req.body.filmId;

    // Check if the film is already in the watchlist
    if (userData.watchlist.includes(filmIdToAdd)) {
      return res.json({ success: false, error: "Film already in watchlist" });
    }

    if (userData.watch.includes(filmIdToAdd)) {
      return res.json({ success: false, error: "Film already watched" });
    }

    // Add the film to the watchlist array
    userData.watchlist.push(filmIdToAdd);

    try {
      await userData.save();
    } catch (error) {
      console.error("Save error:", error);
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while saving" });
    }

    res.json({ success: true });
  });
});

app.post("/api/user/unwatchlist", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    const filmIdToRemove = req.body.filmId;

    // Check if the film is already in the watchlist
    if (!userData.watchlist.includes(filmIdToRemove)) {
      return res.json({ success: false, error: "Film not in watchlist" });
    }

    // Remove the film from the watchlist array
    userData.watchlist = userData.watchlist.filter(
      (id) => id !== filmIdToRemove
    );

    try {
      await userData.save();
    } catch (error) {
      console.error("Save error:", error);
      return res
        .status(500)
        .json({ success: false, error: "An error occurred while saving" });
    }

    res.json({ success: true });
  });
});

app.get("/api/user/liked-films", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    try {
      const likedFilms = await FilmModel.find({ _id: { $in: userData.likes } });
      console.log("Liked Films:", likedFilms);
      res.json({ success: true, likedFilms });
    } catch (error) {
      console.error("Error fetching liked films:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while fetching liked films",
      });
    }
  });
});

app.get("/api/user/watched-films", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    try {
      const watchedFilms = await FilmModel.find({
        _id: { $in: userData.watch },
      });
      console.log("Watched Films:", watchedFilms);
      res.json({ success: true, watchedFilms });
    } catch (error) {
      console.error("Error fetching watched films:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while fetching watched films",
      });
    }
  });
});

app.get("/api/user/watchlist-films", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, TOKEN_KEY, async (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const userData = await User.findOne({ email: user.email });

    if (!userData) {
      return res.sendStatus(404);
    }

    try {
      const watchlistFilms = await FilmModel.find({
        _id: { $in: userData.watchlist },
      });
      console.log("Watchlist Films:", watchlistFilms);
      res.json({ success: true, watchlistFilms });
    } catch (error) {
      console.error("Error fetching watchlist films:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while fetching watchlist films",
      });
    }
  });
});

app.listen(PORT, () => console.log("Server ready"));
