const { Double } = require('bson');
const mongoose = require('mongoose');

// Schema Setup
var terminalSchema = new mongoose.Schema({
    
    address: String,
    print_price: Number,
    description: String,
    
    status: {
        type: String,
        default: "En marche"
    },  

    image: [String],
    imageId: [String],

    admin_email: String,
    admin_reception_error_email: String,
    admin_print_error_email: String,

    admin_phone_number: String,
    admin_reception_error_sms: String,
    admin_print_error_sms: String,

    client_print_success_sms: String,
    client_print_error_sms: String,

    smtp_host: String,
    smtp_port: Number,
    smtp_password: String,

    
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
        
    },

    printers: [{

        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Printer"
        },

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

        createdAt: Date,

    }]


});

module.exports = mongoose.model("Terminal", terminalSchema);
