const fs = require("fs");
const Book = require("../models/Book");
const mongoose = require("mongoose");
const path = require("path");

//créer un livre " post " - creatBook

exports.creatBook = async (req, res) => {
  console.log(req.body);
  delete req.body._id;
  try {
    // Parse le champ book de la requête JSON
    const bookData = JSON.parse(req.body.book);

    //je crée une nouvelle instance aavec les donnée de la requete du user
    const newBook = new Book({
      ...bookData,
      //s'il y'a une image dasn sa requete je récupère sinon null
      imageUrl: `${req.protocol}://${req.get("host")}/uploadsimages/${
        req.file.filename
      }`,
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

exports.modifyBook = async (req, res) => {
  try {
    // Récupérer le livre existant par ID
    const existingBook = await Book.findOne({ _id: req.params.id });

    if (!existingBook) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Mettre à jour les champs du livre avec les nouvelles valeurs sinon je préserve l'ancienne
    existingBook.title = req.body.title || existingBook.title;
    existingBook.author = req.body.author || existingBook.author;
    existingBook.year = req.body.year || existingBook.year;
    existingBook.genre = req.body.genre || existingBook.genre;

    // Mettre à jour l'image si une nouvelle image est fournie

    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (existingBook.imageUrl) {
        fs.unlinkSync(existingBook.imageUrl);
      }

      existingBook.imageUrl = req.file.path;
    }

    // Enregistrer les modifications dans la base de données
    const updatedBook = await existingBook.save();

    res.json({ message: "Livre mis à jour avec succès", book: updatedBook });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du livre :", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du livre" });
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

exports.rateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.body.userId;
    const grade = req.body.rating;

    // Valider la note  entre 0 et 5)
    if (grade < 0 || grade > 5) {
      return res
        .status(400)
        .json({ message: "La note doit être entre 0 et 5" });
    }

    // je vérifie si l'utilisateur a déjà noté ce livre ou non
    const existingRating = await Book.findOne({
      _id: bookId,
      "rating.userId": userId,
    });

    if (existingRating) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }

    // je met a jour la notation au livre
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      {
        $push: { rating: { userId, grade } },
      },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Recalculer la moyenne de notation du livre
    const totalRating = updatedBook.rating
      ? updatedBook.rating.reduce((total, rating) => total + rating.grade, 0)
      : 0;

    const averageRating = updatedBook.rating
      ? totalRating / updatedBook.rating.length
      : 0;

    // Mettre à jour la moyenne de notation dans le livre
    updatedBook.averageRating = averageRating;

    await updatedBook.save();

    res.json(updatedBook);
  } catch (error) {
    console.error("Erreur lors de la notation du livre :", error);
    res.status(500).json({
      error: "Erreur lors de la notation du livre",
      details: error.message,
    });
  }
};
