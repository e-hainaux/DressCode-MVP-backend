const mongoose = require("mongoose");

const brandSchema = mongoose.Schema({
  name: String,
});

const Brand = mongoose.model("brands", brandSchema);

module.exports = Brand;
