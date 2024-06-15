var express = require('express');
var router = express.Router();

require('../models/connection');
const Description = require("../models/descriptions");
const Article = require("../models/articles");
const Weather = require("../models/weathers");
const User = require("../models/users");
const Brand = require("../models/brands");
const { checkBody } = require('../modules/bodyCheck')
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const cloudinary = require('cloudinary').v2;



/* Route POST pour le SignUp */
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['username', 'email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Verifier si l'utilisateur est déjà enregistré
  User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        token: uid2(32),
        avatar: '',
        articles: [],
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // Utilisateur déjà dans la base de donnée
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

/* Route SignIn */
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

//Route PUT pour mettre à jour les données de l'utilisateur 
router.put('/:token/:articleID', (req, res) => {
  const { token, articleID } = req.params;

  User.findOne({ token: token })
    .then(user => {
      if (!user) {
        return res.status(404).send('Utilisateur non trouvé');
      }

      user.articles.push(articleID); // Ajoute l'ID de l'article à la liste des articles de l'utilisateur
      return user.save(); // Sauvegarde les modifications de l'utilisateur dans la base de données
    })
    .then(updatedUser => {
      res.json(updatedUser); // Renvoie l'utilisateur mis à jour en réponse
    })
    .catch(error => {
      res.status(500).json({ result: false, error: 'Internal server error' });
    });
});

// Route DELETE pour supprimer un article de l'user, de la BDD et de Cloudinary

// Fonction pour extraire l'ID public de l'image Cloudinary à partir de l'URL
function extractPublicIdFromUrl(url) {
  const parts = url.split('/');
  const publicIdWithExtension = parts[parts.length - 1]; // Extrait le dernier élément de l'URL (l'ID public avec l'extension)
  const publicId = publicIdWithExtension.split('.')[0]; // Supprime l'extension pour obtenir l'ID public
  return publicId;
}

router.delete("/deleteArticle/:token/:articleID", async (req, res) => {
  const { token, articleID } = req.params;

  try {
    // Recherche de l'utilisateur par token
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    // Suppression de l'article de l'utilisateur
    await User.findOneAndUpdate(
      { token: token },
      { $pull: { articles: articleID } }
    );

    // Recherche de l'article à supprimer
    const article = await Article.findById(articleID);
    if (!article) {
      return res.status(404).send('Article non trouvé');
    }

    // Suppression de l'article
    const deleteInfo = await Article.deleteOne({ _id: articleID });
    console.log(deleteInfo);

    // Suppression de l'image Cloudinary
    const url = article.url_image;
    const publicId = extractPublicIdFromUrl(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).send('Article supprimé avec succès');
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).send('Erreur lors de la suppression de l\'article');
  }
});



module.exports = router;
