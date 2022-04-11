const mongoose = require('mongoose');

// Schema Setup
var campagneSchema = new mongoose.Schema({
  imei: Number,
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
  produit: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produit"
    },
    imei: Number,
    name: String
  },
  symptomes: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Symptome"
    },
    name: String
  }]

});

module.exports = mongoose.model("Campagne", campagneSchema);
