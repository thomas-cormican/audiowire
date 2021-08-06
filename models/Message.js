const mongoose = require("mongoose");

// define message and create message model
const messageSchema = new mongoose.Schema({
  email: String,
  subject: String,
  message: String
}, {
  timestamps: true
});

module.exports = mongoose.model("Message", messageSchema);
