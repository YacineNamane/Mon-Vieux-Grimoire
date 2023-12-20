const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const bookRoutes = require("./routes/book");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/user");

// Je connecte a ma base de données mongoDB
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

// j'éxploite " express.Routrer() " pour aléger ce file en séparons mes routes dans un dossier dédier a ces dernier " routes"
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use(
  "./uploadsimages",
  express.static(path.join(__dirname, "uploadsimages"))
);

module.exports = app;
