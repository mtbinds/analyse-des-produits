var Produit = require("../models/produit");
var Comment = require("../models/comment");
var Message = require("../models/message");
var Review = require("../models/review");

// Tous les middlewares sont ici
var middlewareObj = {};

middlewareObj.checkProduitOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Produit.findById(req.params.id, function (err, foundProduit) {
            if (err || !foundProduit) {
                req.flash("error", "Produit pas trouvé");
                res.redirect("back");
            } else {
                // L'utilisateur est l'auteur de l'produit ?
                if (foundProduit.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Autorisation insuffisante !");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Vous devez être connecté d'abord !");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Commentaire non trouvé");
                res.redirect("back");
            } else {
              // L'utilisateur est l'auteur du commentaire ?
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Autorisation insuffisante");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Vous devez être connecté d'abord !");
        res.redirect("back");
    }
};

middlewareObj.checkMessageOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Message.findById(req.params.message_id, function (err, foundMessage) {
      if (err || !foundMessage) {
        req.flash("error", "Message non trouvé");
        res.redirect("back");
      } else {
        // L'utilisateur est l'auteur du message ?
        if (foundMessage.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "Autorisation insuffisante");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
};


middlewareObj.checkReviewOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Review.findById(req.params.id, function (err, foundReview) {
            if (err || !foundReview) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
              // L'utilisateur est l'auteur de l'évaluation ?
                if (foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Autorisation insuffisante");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Vous devez être connecté d'abord !");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Produit.findById(req.params.id).populate("reviews").exec(function (err, foundProduit) {
            if (err || !foundProduit) {
                req.flash("error", "Image non trouvée.");
                res.redirect("back");
            } else {
                // vérifier si req.user._id exist dans foundProduit.reviews
                var foundUserReview = foundProduit.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "Vous avez déjà écrit une évaluation.");
                    return res.redirect("/produits/" + foundProduit._id);
                }
                next();
            }
        });
    } else {
        req.flash("error", "Vous devez être connectés d'abord !");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function (req, res, next) {
    if ( req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("/login");
};


middlewareObj.checkAgent = function (req, res, next) {
  if (req.isAuthenticated()) {

        if (req.user.role == "agent") {
          return next();
        } else {
          req.flash("error", "Vous devez être agent !");
          res.redirect("back");
        }
      } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
};

middlewareObj.checkAdmin = function (req, res, next) {
  if (req.isAuthenticated()) {

    if (req.user.role =="admin") {
      return next();
    } else {
      req.flash("error", " Vous devez être administrateur !");
      res.redirect("back");
    }
  } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
};

middlewareObj.checkAdminAgent = function (req, res, next) {
  if (req.isAuthenticated()) {

    if (req.user.role =="admin"|| req.user.role =="agent") {
      return next();
    } else {
      req.flash("error", " Vous devez être administrateur ou agent  !");
      res.redirect("back");
    }
  } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
};



module.exports = middlewareObj;
