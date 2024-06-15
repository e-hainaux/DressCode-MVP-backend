const mongoose = require("mongoose");

const weatherSchema = mongoose.Schema({
  type: String,
  temp_min: Number || String,
  temp_max: Number || String,
});

const Weather = mongoose.model("weathers", weatherSchema);

module.exports = Weather;
