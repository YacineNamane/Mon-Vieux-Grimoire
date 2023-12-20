const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Inscription
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({ email, password: hashedPassword });
    const savedUser = await newUser.save();

    res
      .status(201)
      .json({ message: "Inscription réussie", userId: savedUser._id });
  } catch (error) {
    if (
      error.errors &&
      error.errors.email &&
      error.errors.email.kind === "unique"
    ) {
      // Gérer l'erreur d'unicité de l'email
      return res.status(400).json({ error });
    }

    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ error });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id }, "votre_clé_secrète", {
      expiresIn: "24h",
    });

    res.status(200).json({ userId: user._id, token });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};
