const mongoose = require("mongoose");

// define user and create user model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unqiue: true
  },
  username: {
    type: String,
    unqiue: true,
    maxLength: 16
  },
  emailLower: String,
  usernameLower: String,
  password: String,
  profilePic: String,
  bio: {
    type: String,
    maxLength: 300
  },
  bot: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
