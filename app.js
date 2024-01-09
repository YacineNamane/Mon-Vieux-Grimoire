const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const bookRoutes = require("./routes/book");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/user");
const dotenv = require("dotenv").config({ encoding: "latin1" });

// Je connecte a ma base de données mongoDB

mongoose
  .connect(process.env.DBCONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connexion à MongoDB réussie !");
  })
  .catch((error) => {
    console.error("Connexion à MongoDB échouée ! Erreur :", error);
  });

// Middleware CORS permettent d'effectuer les requetes API listé provenant de différents domaines

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

//Sécurité contre les attaque a force brute

const rateLimit = require("express-rate-limit");

app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message:
      "Vous avez effectué plus de 100 requêtes dans une limite de 10 minutes!",
    headers: true,
  })
);

const helmet = require("helmet");
app.use(helmet());

//je met en place le bodyparser pour analyser le corp de l'a requete post lors de l'ajout

app.use(bodyParser.json());

//répertoire de mes images
app.use(
  "/uploadsimages",
  express.static(path.join(__dirname, "uploadsimages"))
);
app.use(
  "/uploadsimages_sharp",
  express.static(path.join(__dirname, "uploadsimages_sharp"))
);

// j'éxploite " express.Routrer() " pour aléger ce file en séparons mes routes dans un dossier dédier a ces dernier " routes"

app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
