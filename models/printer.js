const mongoose = require('mongoose');

var printerSchema = new mongoose.Schema({
    
    name: String,

    status: {
        type: String,
        default: "En marche"
    },

    succeeded_prints: {
        type: Number,
        default: 0
    },

    failed_prints: {
        type: Number,
        default: 0
    },

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
        phone_number: String,
        role: String


    }

});

module.exports = mongoose.model("Printer", printerSchema);
