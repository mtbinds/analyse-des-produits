const { FieldsOnCorrectTypeRule } = require('graphql');
const mongoose = require('mongoose');

// Schema Setup

var clientSchema = new mongoose.Schema({
    
    phone_number: {
        type : String,
        unique: true
    },
    
    orders: [{
        
        terminal : {

            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Terminal"
            }

        },

        terminal_address: String,

        printer : {

            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Printer"
            }   
        },

        printer_name: String,

        succeeded: Boolean,

        createdAt: {
            type: Date,
            default: Date.now
        } 

    }],

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Client", clientSchema);
