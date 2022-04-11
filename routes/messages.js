var express = require("express");
var router = express.Router({
  mergeParams: true
});
var Produit = require("../models/produit");
var Message = require("../models/message");
var middleware = require("../middleware");


// MESSAGES ROUTES
// =====================
// messages new
router.get("/new", middleware.isLoggedIn, (req, res) => {
  // find produit by id
  Produit.findById(req.params.id, (err, produit) => {
    if (err) {
      req.flash("error", err.message);
      console.log(err);
    } else {
      res.render("messages/new", {
        produit: produit
      });
    }
  })
})

// Création de message
router.post("/", middleware.isLoggedIn, (req, res) => {
  Produit.findById(req.params.id, (err, produit) => {
    if (err) {
      req.flash("error", "Message non trouvé");
      res.redirect("/produits");
    } else {
      Message.create(req.body.message, (err, message) => {
        if (err) {
          console.log(err);
          req.flash("error", err.message);
        } else {
          message.author.id = req.user._id;
          message.author.username = req.user.username;
          message.save();
          produit.messages.push(message);
          produit.save();
          req.flash("success", "Message envoyé avec succès");
          res.redirect("/produits/" + produit._id);
        }
      })
    }
  })
})

// MESSAGE EDIT ROUTE
router.get("/:message_id/edit", middleware.checkMessageOwnership, (req, res) => {
  Produit.findById(req.params.id, (err, foundProduit) => {
    if (err || !foundProduit) {
      req.flash("error", "Pas de produits trouvés");
      return res.redirect("back");
    }
    Message.findById(req.params.message_id, (err, foundMessage) => {
      if (err) {
        res.redirect("back");
      } else {
        res.render("messages/edit", {
          produit_id: req.params.id,
          message: foundMessage
        });
      }
    });
  });
});

// MESSAGE UPDATE ROUTE
router.put("/:message_id", middleware.checkMessageOwnership, (req, res) => {
  Message.findByIdAndUpdate(req.params.message_id, req.body.message, (err, updatedMessage) => {
    if (err) {
      res.redirect("back");
      req.flash("error", err.message);
    } else {
      res.redirect("/produits/" + req.params.id);
    }
  })
});

// DESTROY MESSAGE ROUTE
router.delete("/:message_id", middleware.checkMessageOwnership, (req, res) => {
  Message.findByIdAndRemove(req.params.message_id, (err) => {
    if (err) {
      res.redirect("back");
      req.flash("error", err.message);
    } else {
      req.flash("success", "Message supprimé");
      res.redirect("/produits/" + req.params.id);
    }
  })
});



module.exports = router;
