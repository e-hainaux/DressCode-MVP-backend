require("dotenv").config();
require("./models/connection");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

//var indexRouter = require('./routes/index');
var usersRouter = require("./routes/users");
var articlesRouter = require("./routes/articles");
var brandsRouter = require("./routes/brands");
var weathersRouter = require("./routes/weathers");
var descriptionsRouter = require("./routes/descriptions");

var app = express();
const fileUpload = require("express-fileupload");
app.use(fileUpload());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//app.use('/', indexRouter);
app.use("/users", usersRouter);
app.use("/articles", articlesRouter);
app.use("/brands", brandsRouter);
app.use("/weathers", weathersRouter);
app.use("/descriptions", descriptionsRouter);

/*const port = 3000; // Port à écouter
app.listen(port, () => {
  console.log(`🟢 Ecoute sur le port ${port}`);
});*/

module.exports = app;
