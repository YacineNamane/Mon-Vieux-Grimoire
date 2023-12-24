const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book");
const auth = require("../middleware/auth");
const multer = require("../middleware/multerconfig");

// ==> Route GET pour récupérer tous les livres
router.get("/", multer, bookController.getAllBooks);

// ==> show 3 best rating books
router.get("/bestrating", bookController.getBestRatedBooks);

// ==> rate book
router.post("/:id/rating", auth, bookController.rateBook);

// ==> Route pour récupérer les détails d'un livre par ID
router.get("/:id", bookController.getBookDetails);

// ==> Ajouter la route DELETE pour supprimer un livre
router.delete("/:id", auth, bookController.deleteBook);

// ==> Ajouter la route PUT pour mettre à jour un livre
router.put("/:id", auth, multer, bookController.modifyBook);

//je crée une nouvelle instance a partir de la  requete "données rentrée par un  utilisateur"
router.post("/", auth, multer, bookController.creatBook);

module.exports = router;
