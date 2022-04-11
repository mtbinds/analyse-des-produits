const mongoose = require('mongoose');

// Schema Setup
var problemeSchema = new mongoose.Schema({
  numero: Number,
  name: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String,
    firstname: String,
    lastname: String,
    email: String,
    role: String
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],
  plants: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant"
    },
    name: String
  }]

});

module.exports = mongoose.model("Probleme", problemeSchema);
