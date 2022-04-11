var express = require("express");
var router = express.Router({
    mergeParams: true
});
var Produit = require("../models/produit");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    Produit.findById(req.params.id).populate({
        path: "reviews",
        options: {
            sort: {
                createdAt: -1
            }
        }
    }).exec(function (err, produit) {
        if (err || !produit) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {
            produit: produit
        });
    });
});

// Reviews New (nouvelle évaluation)
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    Produit.findById(req.params.id, function (err, produit) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {
            produit: produit
        });

    });
});

// Reviews Create (création d'une évaluation)
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    Produit.findById(req.params.id).populate("reviews").exec(function (err, produit) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.produit = produit;
            review.save();
            produit.reviews.push(review);
            produit.rating = calculateAverage(produit.reviews);
            produit.save();
            req.flash("success", "Votre évaluation a bien été ajoutée.");
            res.redirect('/produits/' + produit._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {
            produit_id: req.params.id,
            review: foundReview
        });
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {
        new: true
    }, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Produit.findById(req.params.id).populate("reviews").exec(function (err, produit) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            produit.rating = calculateAverage(produit.reviews);
            produit.save();
            req.flash("success", "Votre évaluation a bien été mise à jour.");
            res.redirect('/produits/' + produit._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Produit.findByIdAndUpdate(req.params.id, {
            $pull: {
                reviews: req.params.review_id
            }
        }, {
            new: true
        }).populate("reviews").exec(function (err, produit) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            produit.rating = calculateAverage(produit.reviews);
            produit.save();
            req.flash("success", "Votre évaluation a bien été supprimée.");
            res.redirect("/produits/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;
