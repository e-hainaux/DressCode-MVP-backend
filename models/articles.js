const mongoose = require("mongoose");

const articleSchema = mongoose.Schema({
  weather: { type: mongoose.Schema.Types.ObjectId, ref: "weathers" },
  useDate: Date,
  favorite: Boolean,
  url_image: String,
  description: { type: mongoose.Schema.Types.ObjectId, ref: "descriptions" },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "brands" },
});

const Article = mongoose.model("articles", articleSchema);

module.exports = Article;
