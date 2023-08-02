var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Terminal = require("../models/terminal");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");


// Multer/Cloudinary
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function(req, file, cb) {
  // accepter que des images
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Que les fichiers de type image sont autorisés !'), false);
  }
  cb(null, true);
};
const upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dajeg1r6h',
  api_key: 152352994553188,
  api_secret: '-bVk1M89N4tQ_rS-nSepQ5amK4Y'
});

// ROOT ROUTE
router.get("/", (req, res) => {
    res.render("landing");
});

// AUTH ROUTES
// ==============

// REGISTER ROUTE - shows register form
router.get("/register", (req, res) => {
    res.render("register", {
        page: "register"
    });
});

router.post("/register",upload.single('avatar'), (req, res) => {

  if(req.file){

  cloudinary.v2.uploader.upload(req.file.path, function(err, result) {

    if (err) {
      req.flash('error', "Téléchargement de l'image est impossible, Réessayez svp.");
      return req.redirect('back');
    }

    req.body.avatar = result.secure_url;
    req.body.avatarId = result.public_id;

    var newUser = new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      role : "utilisateur",
      email: req.body.email,
      phone_number: req.body.phone_number,
      avatar: req.body.avatar,
      avatarId: req.body.avatarId
    });

    User.register(newUser, req.body.password, (err, user) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/register");
      }
      passport.authenticate("local")(req, res, function () {
        req.flash("success", "Bienvenue au site de gestion de bornes " + user.username);
        res.redirect("/terminals");
      });
    });
  });

  }else{

    req.body.avatar = "";
    req.body.avatarId = "";

    var newUser = new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      role : "utilisateur",
      email: req.body.email,
      phone_number: req.body.phone_number,
      avatar: req.body.avatar,
      avatarId: req.body.avatarId
    });

    User.register(newUser, req.body.password, (err, user) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/register");
      }
      passport.authenticate("local")(req, res, function () {
        req.flash("success", "Bienvenue au site de gestion de bornes " + user.username);
        res.redirect("/terminals");
      });
    });
  }


});
// LOGIN ROUTES

router.get("/login", (req, res) => {
    res.render("login", {
        page: "login"
    });
});

router.post("/login", passport.authenticate("local", {
        successRedirect: "/terminals",
        failureRedirect: "/login",
        failureFlash: true
    }),
    // callback
    (req, res) => {});

// LOGOUT ROUTE
router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { 
      return next(err); 
      }
    res.redirect('/');
  });
});

// FORGOT PASSWORD
router.get('/forgot', function (req, res) {
    res.render('forgot');
});

router.post('/forgot', function (req, res, next) {

    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },

        function (token, done) {
            User.findOne({
                email: req.body.email
            }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Pas de compte enregistré avec cette adresse e-mail !.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },

        function (token, user, done) {

            var smtpTransport = nodemailer.createTransport({

                service: 'Gmail',

                auth: {
                    user: 'myEmailTesterRequest@gmail.com',//TO DO
                    pass: "Tester99"
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'myEmailTesterRequest@gmail.com',
                subject: 'Site de gestion de bornes Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');
                req.flash('success', 'Un e-mail a été envoyé pour' + user.email);
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

// 
router.get('/reset/:token', function (req, res) {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            req.flash('error', 'Le lien de réinitialisation de mot de passe est expiré.');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            token: req.params.token
        });
    });
});


router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Le lien de réinitialisation de mot de passe est expiré.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Les mots de passe ne se correspondent pas.");
                    return res.redirect('back');
                }
            });
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'myEmailTesterRequest@gmail.com',
                    pass: "Tester99"
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'myEmailTesterRequest@gmail.com',
                subject: 'Votre mot de passe a bien été changé',
                text: 'Hello,\n\n' +
                    'Une confirmation que votre mot de passe de votre  mail ' + user.email + ' a bien été changé.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success', 'Votre mot de passe a bien été changé.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/terminals');
    });
});

// USERS PROFILE
router.get("/users/profile/:id", (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {

    if (err) {
      req.flash("error", "erreur");
      res.redirect("back");
    }

    Terminal.find().where("author.id").equals(foundUser._id).exec((err, terminals) => {

      if (err) {
        req.flash("error", "erreur");
        return res.redirect("/");
      }

      res.render("users/show", {
        user: foundUser,
        terminals: terminals
      });

    });

  });
});


module.exports = router;
