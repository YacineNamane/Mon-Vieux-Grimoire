const express = require("express");
const router = express.Router();
const multer = require("multer");
const bookController = require("../controllers/book");
const auth = require("../middleware/auth");

//mise en place de mutler pour gérer mes file dans mon cas les images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploadsimages/"); // Dossier où seront stockées mes images
  },
  filename: function (req, file, cb) {
    // Vérifier l'extension du fichier
    const validExtensions = ["jpg", "jpeg", "png"];
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    if (validExtensions.includes(fileExtension)) {
      cb(null, Date.now() + "-" + file.originalname);
    } // Nom des images avec une approche simple et logique
    else {
      // Retourner une erreur pour un format de fichier non autorisé
      cb(new Error("Format de fichier non autorisé"));
    }
  },
});

const upload = multer({ storage: storage });

// ==> Route GET pour récupérer tous les livres
router.get("/", bookController.getAllBooks);

//je crée une nouvelle instance a partir de la  requete "données rentrée par un  utilisateur"
router.post("/", auth, upload.single("image"), bookController.creatBook);

// ==> Route pour récupérer les détails d'un livre par ID
router.get("/:id", bookController.getBookDetails);

// ==> Ajouter la route DELETE pour supprimer un livre
router.delete("/:id", auth, bookController.deleteBook);

// ==> Ajouter la route PUT pour mettre à jour un livre
router.put("/:id", auth, upload.single("image"), bookController.modifyBook);

module.exports = router;
