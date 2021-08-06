const mongoose = require("mongoose");

// define post and create post model
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    maxLength: 60
  },
  description: {
    type: String,
    maxLength: 240
  },
  file: String,
  instrument: {
    type: String,
    default: 'unknown'
  },
  genre: {
    type: String,
    default: 'unknown'
  },
  key: {
    type: String,
    default: 'unknown'
  },
  tempo: Number,
  likes: [String],
  createdByUsername: String,
  createdById: mongoose.ObjectId
}, {
  timestamps: true
});

module.exports = mongoose.model("Post", postSchema);
