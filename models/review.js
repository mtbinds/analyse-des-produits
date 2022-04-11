var mongoose = require("mongoose");

var reviewSchema = new mongoose.Schema({
    rating: {

        type: Number,
        required: "Veuillez laisser une note svp (1-5 étoiles).",
        min: 1,
        max: 5,
        validate: {

            validator: Number.isInteger,
            message: "{VALUE} is not an integer value."
        }
    },
    // La  text
    text: {
        type: String
    },
    // author id and username fields
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    // produit associated with the review
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produit"
    }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});

module.exports = mongoose.model("Review", reviewSchema);
