const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const Book = require("./models/Book");
const bodyParser = require("body-parser");

mongoose
  .connect(
    "mongodb+srv://YacineNamane:1234@cluster0.xymbxwd.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("Connexion à MongoDB réussie !");
  })
  .catch((error) => {
    console.error("Connexion à MongoDB échouée ! Erreur :", error);
  });

// Middleware CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});
//je met en place le bodyparser pour analyser le corp de l'a requete post lors de l'ajout
app.use(bodyParser.json());

//je crée une nouvelle instance a partir de l'a  requete "données rentrée par un  utilisateur"
app.post("/api/books", async (req, res) => {
  try {
    const newBook = new Book({
      ...req.body,

      //ici sois j'impose un rating sois je laisse par defaut et vu que c'est une fonctionnelité du  site on laisse par defaut 0

      ratings: [],
      averageRating: 0,
    });

    // j'enregistre  le livre dans la base de données
    const savedBook = await newBook.save();

    res
      .status(201)
      .json({ message: "Livre ajouté avec succès", book: savedBook });
  } catch (error) {
    console.error("Erreur lors de l'ajout du livre :", error);
    res.status(500).json({ error: "Erreur lors de l'ajout du livre" });
  }
});

module.exports = app;
