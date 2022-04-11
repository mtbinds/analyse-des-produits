const mongoose = require('mongoose');

// Schema Setup
var typeSchema = new mongoose.Schema({
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
    role: String,
    email: String
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],

});

module.exports = mongoose.model("Type", typeSchema);
