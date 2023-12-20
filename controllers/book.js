const fs = require("fs");
const Book = require("../models/Book");

//créer un livre " post " - creatBook

exports.creatBook = async (req, res) => {
  delete req.body._id;
  try {
    //je crée une nouvelle instance aavec les donnée de la requete du user
    const newBook = new Book({
      ...req.body,
      //s'il y'a une image dasn sa requete je récupère sinon null
      imageUrl: req.file ? `/uploadsimages/${req.file.filename}` : null,
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
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    res.json(book);
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

exports.deleteBook = async (req, res) => {
  try {
    // Je récupérer le livre pour obtenir le chemin de l'image dans un premier temps
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Supprimer le livre de la base de données
    await Book.deleteOne({ _id: req.params.id });

    // Supprimer l'image associée si elle existe avec le fsunlikSync
    if (book.imageUrl) {
      fs.unlinkSync(book.imageUrl);
    }

    res.json({ message: "Livre supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du livre :", error);
    res.status(500).json({ error: "Erreur lors de la suppression du livre" });
  }
};

// Modification d'un livre " put " modifyBook

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
