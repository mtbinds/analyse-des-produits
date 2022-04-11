var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


// USER -username, password
var userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    role: String,
    firstname: String,
    lastname: String,
    password: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    avatar: String,
    avatarId: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
