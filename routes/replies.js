var express = require("express");
var router = express.Router({
  mergeParams: true
});

var Message = require("../models/message");
var Reply = require("../models/reply");
var middleware = require("../middleware");


// REPLIES ROUTES
// =====================
// nouveau reply
router.get("/new", middleware.isLoggedIn, (req, res) => {
  // trouver une produit par id
  Message.findById(req.params.id, (err, message) => {
    if (err) {
      req.flash("error", err.message);
      console.log(err);
    } else {
      res.render("reply/new", {
        message: message
      });
    }
  })
})

// Création de réponse
router.post("/", middleware.isLoggedIn, (req, res) => {

  Message.findById(req.params.id, (err, message) => {
    if (err) {
      req.flash("error", "Réponse non trouvée");
      res.redirect("/messages");
    } else {
      // création de nouvelle réponse
      Reply.create(req.body.reply, (err, reply) => {
        if (err) {
          console.log(err);
          req.flash("error", err.message);
        } else {
          // ajout de username et id à reply
          reply.author.id = req.user._id;
          reply.author.username = req.user.username;
          reply.text = req.body.text;
          // enregistrement
          reply.save();
          // connecte une nouvelle réponse à un message
          message.replies.push(reply);
          message.save();
          req.flash("success", "Réponse envoyée avec succès");
          res.redirect("/produits");
        }
      })
    }
  })
})

// REPLY EDIT ROUTE
router.get("/:reply_id/edit", middleware.checkMessageOwnership, (req, res) => {
  Message.findById(req.params.id, (err, foundMessage) => {
    if (err || !foundMessage) {
      req.flash("error", "Pas de messages trouvés");
      return res.redirect("back");
    }
    Reply.findById(req.params.reply_id, (err, foundReply) => {
      if (err) {
        res.redirect("back");
      } else {
        res.render("replies/edit", {
          message_id: req.params.id,
          reply: foundReply
        });
      }
    });
  });
});

// REPLY UPDATE ROUTE
router.put("/:reply_id", middleware.checkAdminAgent, (req, res) => {

  Reply.findByIdAndUpdate(req.params.reply_id, req.body.reply, (err, updatedReply) => {
    if (err) {
      res.redirect("back");
      req.flash("error", err.message);
    } else {
      res.redirect("/messages/" + req.params.id);
    }
  })
});

// DESTROY MESSAGE ROUTE

router.delete("/:reply_id", middleware.checkAdminAgent, (req, res) => {

  Reply.findByIdAndRemove(req.params.reply_id, (err) => {
    if (err) {
      res.redirect("back");
      req.flash("error", err.message);
    } else {
      req.flash("success", "Réponse supprimée");
      res.redirect("/messages/" + req.params.id);
    }
  })
});


module.exports = router;
