const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    token: String,
    avatar: String,
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "articles" }],
});


const User = mongoose.model('users', userSchema);

module.exports = User;