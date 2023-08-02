var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var User = require("../models/user");

var Terminal = require("../models/printer");
var Printer = require("../models/printer");
var Client = require("../models/client");

// Multer/Cloudinary
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function(req, file, cb) {
  // accepter que les images
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Que les fichiers image sont autorisés!'), false);
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

//INDEX - Show all users (tous les utilisateurs)
router.get('/', middleware.checkAdmin ,function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {

    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    User.find({
      $or: [
        {
          username: regex
        },
        {
          role: regex
        }
      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allUsers) {
        User.count({
          name: regex
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allUsers.length < 1) {
              req.flash(
                'error',
                'Aucun utilisateur correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('users/index', {
              users: allUsers,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });

  } else {

    // Tous les utilisateurs de la base de données
    User.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allUsers) {
        User.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('users/index', {
              users: allUsers,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
            });
          }
        });
      });
  }
});

// CREATE - (création d'un nouveau utilisateur)

router.post('/', middleware.checkAdmin , upload.single('avatar'), (req, res) => {

  if(req.file){

   cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
    if (err) {
      req.flash('error', "Téléchargement de l'image est impossible, Réessayez svp.");
      return req.redirect('back');
    }
    // add cloudinary url for the image to the produit object under image property
    req.body.user.avatar = result.secure_url;
    // add image's public_id to produit object
    req.body.user.avatarId = result.public_id;

     const newUser = new User({
       username: req.body.user.username,
       firstname: req.body.user.firstname,
       lastname: req.body.user.lastname,
       role : req.body.user.role,
       email: req.body.user.email,
       phone_number: req.body.user.phone_number,
       avatar: req.body.user.avatar,
       avatarId: req.body.user.avatarId
     });

     User.register(newUser, req.body.user.password, (err, user) => {

       if (err) {
         req.flash("error", err.message);
         return res.redirect("/users/new");
       }

       res.redirect("/users");

     });

   });

  }else{

    req.body.user.avatar = "";
    req.body.user.avatarId = "";

    const newUser = new User({
      username: req.body.user.username,
      firstname: req.body.user.firstname,
      lastname: req.body.user.lastname,
      role : req.body.user.role,
      email: req.body.user.email,
      avatar: req.body.user.avatar,
      avatarId: req.body.user.avatarId
    });

    User.register(newUser, req.body.user.password, (err, user) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/users/new");
      }
      res.redirect("/users");
    });
  }

});


// NEW - formulaire de création d'un utilisateurs
router.get('/new', middleware.checkAdmin, (req, res) => {
  res.render('users/new');
});


// EDIT USER ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    res.render('users/edit', {
      user: foundUser
    });
  });
});

// UPDATE USER ROUTE
router.post('/:id', middleware.checkAdmin, upload.single('avatar'), (req, res) => {

    User.findById(req.params.id, async function(err, user) {
      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        if (req.file) {
          try {
            if(user.avatarId !=""){
            await cloudinary.v2.uploader.destroy(user.avatarId);
            }
            const result = await cloudinary.v2.uploader.upload(
              req.file.path
            );
            user.username = req.body.username;
            user.firstname= req.body.firstname;
            user.lastname= req.body.lastname;
            user.role= req.body.role;
            user.password= req.body.password;
            user.email= req.body.email;
            user.avatar = result.secure_url;
            user.avatarId = result.public_id;
            user.save();
          } catch (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
        }else{
          user.username = req.body.username;
          user.firstname= req.body.firstname;
          user.lastname= req.body.lastname;
          user.role= req.body.role;
          user.email= req.body.email;
          user.avatarId = "";
          user.avatar = "";
          user.save();
        }
        req.flash('success', 'Mise à jour réussie!');
        res.redirect('/users');
      }
    });
  });



// DESTROY USERS ROUTE
router.delete('/:id', middleware.checkAdmin, function(req, res) {

  User.findById(req.params.id, function(err, user) {

    if (err) {
      res.redirect('/users');
    } else {

      const terminals = Terminal.find();
      const printers = Printer.find();
      
      let verif_terminal = false;
      let verif_printer = false; 

      if(terminals || printers){

        if (terminals){

            terminals.forEach(terminal => {

              if (terminal.author._id == req.params.id){
            
                verif_terminal = true;

              } 

            });

        }

        if (printers){

            printers.forEach(printer => {

              if (printer.author._id == req.params.id){
          
                verif_printer = true;

              } 

            });
        }

      };

      if (verif_terminal || verif_printer){

        if (verif_terminal){

          req.flash('error', 'Veuillez supprimer la borne installée par cet utilisateur !');
          res.redirect('back');

        }

        if (verif_printer){

          req.flash('error', 'Veuillez supprimer l\'imprimante installée par cet utilisateur !');
          res.redirect('back');

        }

      }else{

       // Supprimer l'utilisateur
       user.remove();
       req.flash('success', 'Utilisateur supprimé avec succès !');
       res.redirect('/users');

      }

       
    }

  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;
