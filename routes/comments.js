var express = require("express");
var router = express.Router({
    mergeParams: true
});
var Produit = require("../models/produit");
var Comment = require("../models/comment");
var middleware = require("../middleware");


// COMMENTS ROUTES
// =====================
// comments new
router.get("/new", middleware.isLoggedIn, (req, res) => {
    // Chercher produit par id
    Produit.findById(req.params.id, (err, produit) => {
        if (err) {
            req.flash("error", err.message);
            console.log(err);
        } else {
            res.render("comments/new", {
                produit: produit
            });
        }
    })
})

// Création du commentaire

router.post("/", middleware.isLoggedIn, (req, res) => {
    Produit.findById(req.params.id, (err, produit) => {
        if (err) {
            req.flash("error", "Commentaire non trouvé");
            res.redirect("/produits");
        } else {
            // création d'un commentaire
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    console.log(err);
                    req.flash("error", err.message);
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    produit.comments.push(comment);
                    produit.save();
                    req.flash("success", "Commentaire ajouté avec succès");
                    res.redirect("/produits/" + produit._id);
                }
            })
        }
    })
})

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    Produit.findById(req.params.id, (err, foundProduit) => {
        if (err || !foundProduit) {
            req.flash("error", "Pas de produits trouvées");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err) {
                res.redirect("back");
            } else {
                res.render("comments/edit", {
                    produit_id: req.params.id,
                    comment: foundComment
                });
            }
        });
    });
});

// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
        if (err) {
            res.redirect("back");
            req.flash("error", err.message);
        } else {
            res.redirect("/produits/" + req.params.id);
        }
    })
});

// DESTROY COMMENT ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if (err) {
            res.redirect("back");
            req.flash("error", err.message);
        } else {
            req.flash("success", "Commentaire supprimé");
            res.redirect("/produits/" + req.params.id);
        }
    })
});



module.exports = router;
