const mongoose = require('mongoose');


var messageSchema = new mongoose.Schema({
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  },

  replies: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reply"
    },
    text: String
  }],

  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  }

});

module.exports = mongoose.model("Message", messageSchema);
