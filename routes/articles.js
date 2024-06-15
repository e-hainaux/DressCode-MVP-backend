var express = require("express");
var router = express.Router();

const Description = require("../models/descriptions");
const Article = require("../models/articles");
const Weather = require("../models/weathers");
const User = require("../models/users");
const Brand = require("../models/brands");

const cloudinary = require("cloudinary").v2;
const uniqid = require("uniqid");
const fs = require("fs");

/* POST upload photo prise par l'utilisateur  */
router.post("/upload", async (req, res) => {
  // console.log(req.files.photoFromFront);

  const photoPath = `./tmp/${uniqid()}.jpg`;
  console.log(photoPath);
  const resultMove = await req.files.photoFromFront.mv(photoPath);

  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);

    fs.unlinkSync(photoPath);

    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultMove });
  }
});

/* POST article complet (photo > url) */

router.post("/", (req, res) => {
  const { weather, useDate, favorite, url_image, description, brand } =
    req.body;
  const newArticle = new Article({
    weather,
    useDate,
    favorite,
    url_image,
    description,
    brand,
  });
  newArticle
    .save()
    .then((savedArticle) => {
      res.json({ result: true, newArticle: savedArticle });
    })
    .catch((error) => console.error(error));
});

// Route POST pour envoyer les photos importées de la photothèque vers Cloudinary

router.post("/import", async (req, res) => {
  const file = req.files.photoFromFront; // Obtenir le fichier envoyé dans la requête
  if (!file) {
    return res.status(400).json({ error: "Aucun fichier n'a été envoyé." });
  }

  const photoPath = `./tmp/${uniqid()}.jpg`;

  try {
    await file.mv(photoPath); // Déplacer le fichier vers un emplacement temporaire
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);

    // Supprimer le fichier temporaire
    fs.unlinkSync(photoPath);

    // Envoyer l'URL de l'image téléchargée comme réponse
    res.status(200).json({ result: true, url: resultCloudinary.secure_url });
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image :", error);
    res
      .status(500)
      .json({ error: "Erreur lors du téléchargement de l'image." });
  }
});

// Route GET pour afficher les articles de l'utilisateur dans le dressing
router.get("/dressing/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .populate({
      path: "articles", // Accéder au champ articles de l'utilisateur
      populate: { path: "description" }, // Accéder au champ description des articles
    })
    .populate({
      path: 'articles', // Accéder au champ articles de l'utilisateur
      populate: { path: 'brand' } // Accéder au champ brand des articles
    })
    .populate({
      path: 'articles', // Accéder au champ articles de l'utilisateur
      populate: { path: 'weather' } // Accéder au champ weather des articles
    })
    .then(user => {
      if (!user) {
        return res.status(404).send("Utilisateur non trouvé");
      }
      res.json(user.articles); // Renvoyer les articles associés à l'utilisateur avec leurs descriptions
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Erreur lors de la recherche de l'utilisateur");
    });
});

router.get("/:favorite", async (req, res) => {
  const { favorite } = req.params; // Utilisez req.params pour obtenir les paramètres de l'URL

  // Récupération des articles selon la requête spécifiée
  Article.find({ favorite: true })
    .then((articles) => res.json(articles))
    .catch((error) => {
      console.error("Erreur lors de la récupération des articles :", error);
      res.status(500).json({ message: "Erreur serveur" });
    });
});

// Route GET pour afficher les articles selon la météo et la description
router.get("/dressing/homeArticle/:token", async (req, res) => {
  const { token } = req.params;
  const { type, temp_min, temp_max, category } = req.query;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const articleFilter = { _id: { $in: user.articles } }; // Filtre pour rechercher dans les articles de l'utilisateur

    // Filtrer par météo si des paramètres de météo sont fournis
    if (type || temp_min || temp_max) {
      const weatherFilter = {};
      if (type) weatherFilter.type = type;
      if (temp_min) weatherFilter.temp_min = temp_min;
      if (temp_max) weatherFilter.temp_max = temp_max;

      const weather = await Weather.find(weatherFilter);
      if (weather && weather.length > 0) {
        // Récupérer les IDs des météos correspondantes
        const weatherIds = weather.map((w) => w._id);
        // Ajouter les IDs dans le filtre des articles
        articleFilter.weather = { $in: weatherIds };
      }
    }

    // Filtrer par description si la catégorie est fournie
    if (category) {
      const descriptionFilter = { category };
      const descriptions = await Description.find(descriptionFilter);
      if (descriptions && descriptions.length > 0) {
        // Récupérer les IDs des descriptions correspondantes
        const descriptionIds = descriptions.map((d) => d._id);
        // Ajouter les IDs dans le filtre des articles
        articleFilter.description = { $in: descriptionIds };
      }
    }

    // Effectuer la requête pour les articles en utilisant le filtre combiné
    const articles = await Article.find(articleFilter).populate("description");

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Aucun article trouvé avec ces critères de recherche",
      });
    }

    res.json(articles);
    //console.log(articles)
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
