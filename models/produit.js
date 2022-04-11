const mongoose = require('mongoose');

// Schema Setup
var produitSchema = new mongoose.Schema({
    imei: Number,
    name: String,
    status: String,
    publication: String,
    image: [String],
    imageId: [String],
    description: String,
    availability: Date,
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
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    rating: {
        type: Number,
        default: 0
    },
    type: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Type"
      },
      name: String
    },
    modele: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Modele"
      },
      name: String
    }
});

module.exports = mongoose.model("Produit", produitSchema);
