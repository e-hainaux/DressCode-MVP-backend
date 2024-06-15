var express = require("express");
var router = express.Router();

const Weather = require("../models/weathers");


/* POST ajout weather par l'utilisateur  */
router.post("/", (req, res) => {
  const { type, temp_min, temp_max } = req.body;
  // Recherche du weather dans la BDD
  Weather.findOne({ type, temp_min, temp_max })
    .then(existingWeather => {
      if (existingWeather) {
        //si un weather existe
        res.json({ result: false, existingWeather })
      } else {
        const newWeather = new Weather({
          type,
          temp_min,
          temp_max,
        });
        newWeather
          .save()
          .then((savedWeather) => {
            res.json({ result: true, newWeather: savedWeather });
          })
          .catch((error) => console.error(error));
      }
    })
    .catch(error => console.error(error));
});

// Route GET pour chercher des configurations de météo

router.get("/", async (req, res) => {
  const { type, temp_min, temp_max } = req.query; // Utilisation de req.query pour récupérer les paramètres de recherche

  const filter = {};
  if (type) filter.type = type;
  if (temp_min) filter.temp_min = temp_min;
  if (temp_max) filter.temp_max = temp_max;


  try {
    const weather = await Weather.find(filter);
    res.json(weather);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
