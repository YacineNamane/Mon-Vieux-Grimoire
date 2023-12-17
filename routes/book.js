const express = require("express");
const router = express.Router();
const multer = require("multer");
const bookController = require("../controllers/book");

//mise en place de mutler pour gérer mes file dans mon cas les images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploadsimages/"); // Dossier où seront stockées mes images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Nom des images avec une approche simple et logique
  },
});

const upload = multer({ storage: storage });

// ==> Route GET pour récupérer tous les livres
router.get("/", bookController.getAllBooks);

//je crée une nouvelle instance a partir de la  requete "données rentrée par un  utilisateur"
router.post("/", upload.single("image"), bookController.creatBook);

// ==> Route pour récupérer les détails d'un livre par ID
router.get("/:id", bookController.getBookDetails);

// ==> Ajouter la route DELETE pour supprimer un livre
router.delete("/:id", bookController.deleteBook);

// ==> Ajouter la route PUT pour mettre à jour un livre
router.put("/:id", upload.single("image"), bookController.modifyBook);

module.exports = router;
