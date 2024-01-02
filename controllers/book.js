const fs = require("fs");
const Book = require("../models/Book");
const mongoose = require("mongoose");
const sharp = require("sharp");
const path = require("path");

//créer un livre " post " - creatBook

exports.createBook = async (req, res) => {
  console.log(req.body);
  delete req.body._id;
  try {
    // Parse le champ book de la requête JSON
    const bookData = JSON.parse(req.body.book);
    console.log(bookData);

    // Chemin du fichier téléchargé par Multer
    const imagePath = `./uploadsimages/${req.file.filename}`;

    // Utilisez Sharp pour redimensionner ou effectuer d'autres opérations sur l'image
    await sharp(imagePath)
      .resize({ width: 260, height: 260 })
      .toFormat("jpeg", { quality: 80 })
      .withMetadata(false) // Supprime les métadonnées
      .toFile(`./uploadsimages/${req.file.filename}-resized.jpg`);

    //je crée une nouvelle instance aavec les donnée de la requete du user
    const newBook = new Book({
      ...bookData,

      //s'il y'a une image dans sa requete je récupère sinon null
      imageUrl: `${req.protocol}://${req.get("host")}/uploadsimages/${
        req.file.filename
      }-resized.jpg`,

      //ici sois j'impose un rating sois je laisse par defaut et vu que c'est une fonctionnelité du  site on laisse par defaut 0
      ratings: [],
      averageRating: 0,
    });
    console.log(newBook);

    // j'enregistre  le livre dans la base de données
    const savedBook = await newBook.save();

    res
      .status(201)
      .json({ message: "Livre ajouté avec succès", book: savedBook });
  } catch (error) {
    console.error("Erreur lors de l'ajout du livre :", error);
    res.status(400).json({ error: "Erreur lors de l'ajout du livre" });
  }
};

//Récupérer tous  les livres en back d'accueil " get " - getALLBooks

exports.getAllBooks = async (req, res) => {
  try {
    // Recherche tous les livres dans la base de données
    const allBooks = await Book.find();

    res.status(200).json(allBooks);
  } catch (error) {
    console.error("Erreur lors de la récupération du livre :", error);
    res.status(400).json({ error: "Erreur lors de la récupération du livre" });
  }
};

//Récupérer les détail d'un seul livre " get " - getBookDetails

exports.getBookDetails = async (req, res) => {
  try {
    const bookId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "ID de livre non valide" });
    }

    const book = await Book.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }
    const ratings = book.ratings || [];
    const bookWithEmptyRatings = { ...book._doc, ratings };

    res.json(bookWithEmptyRatings);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails du livre :",
      error
    );
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des détails du livre" });
  }
};

// Suppression d'un livre spécifique par ID " delete " deleteBook

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    if (book.userId !== req.userData.userId) {
      return res.status(401).json({ message: "Vous n'êtes pas autorisé" });
    }

    const filename = book.imageUrl.split("/uploadsimages/")[1];

    // Supprimer l'image associée
    fs.unlink(`uploadsimages/${filename}`, (unlinkError) => {
      if (unlinkError) {
        console.error(
          "Erreur lors de la suppression de l'image :",
          unlinkError
        );
      }

      // Supprimer le livre de la base de données
      book
        .deleteOne({ _id: req.params.id })
        .then(() => {
          res.status(200).json({ message: "Livre supprimé avec succès" });
        })
        .catch((deleteError) => {
          console.error(
            "Erreur lors de la suppression du livre :",
            deleteError
          );
          res
            .status(500)
            .json({ error: "Erreur lors de la suppression du livre" });
        });
    });
  } catch (error) {
    console.error("Erreur lors de la recherche du livre :", error);
    res.status(500).json({ error: "Erreur lors de la recherche du livre" });
  }
};

// Modifier les données d'un livre

exports.modifyBook = async (req, res) => {
  const bookObject = req.file
    ? {
        ...req.body,
        imageUrl: `${req.protocol}://${req.get("host")}/uploadsimages/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  try {
    const existingBook = await Book.findOne({ _id: req.params.id });

    if (!existingBook) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    if (existingBook.userId !== req.userData.userId) {
      return res.status(401).json({ message: "Vous n'êtes pas autorisé" });
    }

    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );

    res.status(200).json({ message: "Livre modifié avec succès" });
  } catch (error) {
    console.error("Erreur lors de la modification du livre :", error);
    res.status(500).json({ error: "Erreur lors de la modification du livre" });
  }
};

// Récupérer les 3 livres les mieux notés "get" - getBestRatedBooks

exports.getBestRatedBooks = async (req, res) => {
  try {
    const bestRatedBooks = await Book.find()
      .sort({ averageRating: -1 }) // Trie par ordre décroissant de la note moyenne
      .limit(3); // Limite à 3 livres

    res.status(200).json(bestRatedBooks);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des livres les mieux notés :",
      error
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des livres les mieux notés",
    });
  }
};

// Notation d'un liste " post "

exports.rateBook = async function postRating(req, res) {
  try {
    const bookId = req.params.id;
    const userId = req.body.userId;
    const grade = req.body.rating;

    // Valider la note entre 0 et 5
    if (grade < 0 || grade > 5) {
      return res
        .status(400)
        .json({ message: "La note doit être entre 0 et 5" });
    }

    // Vérifier si le livre existe dans la base de données
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà noté ce livre ou non
    const alreadyVoted =
      book.rating && book.rating.find((r) => r.userId === userId);

    if (alreadyVoted) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }

    // Mettre à jour la notation du livre
    book.ratings.push({ userId, grade });

    // Recalculer la moyenne de notation du livre
    const totalRating = book.ratings.reduce((total, r) => total + r.grade, 0);
    const averageRating = totalRating / book.ratings.length;

    // Mettre à jour la moyenne de notation dans le livre
    book.averageRating = averageRating;

    // Sauvegarder le livre mis à jour
    const updatedBook = await book.save();

    res.json(updatedBook);
  } catch (error) {
    console.error("Erreur lors de la notation du livre :", error);
    res.status(500).json({
      error: "Erreur lors de la notation du livre",
      details: error.message,
    });
  }
};
