var express = require('express');
var router = express.Router();
var Produit = require('../models/produit');
var Modele = require('../models/modele');
var middleware = require('../middleware');

// Multer/Cloudinary
var multer = require('multer');

// Multer setup
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var imageFilter = function(req, file, cb) {
  // accepter que les images
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Que les fichiers image sont autorisés!'), false);
  }
  cb(null, true);
};

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dajeg1r6h',
  api_key: 152352994553188,
  api_secret: '-bVk1M89N4tQ_rS-nSepQ5amK4Y'
});

var upload = multer({ storage: storage });


async function uploadToCloudinary(locaFilePath) {

  var mainFolderName = "main";
  var filePathOnCloudinary =
    mainFolderName + "/" + locaFilePath;

  return cloudinary.uploader
    .upload(locaFilePath, { public_id: filePathOnCloudinary })
    .then((result) => {


      return {
        message: "Success",
        url: result.url,
        id: result.public_id,
      };
    })
    .catch((error) => {

      fs.unlinkSync(locaFilePath);
      return { message: "Fail" };
    });
}

//INDEX - Tous les modeles
router.get('/', function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {

    Modele.find({
      $or: [
        {
          _id : req.query.search
        }

      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allModeles) {
        Modele.count({
          _id: req.query.search
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allModeles.length < 1) {
              req.flash(
                'error',
                'Aucun modèle correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('modeles/index', {
              modeles: allModeles,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });
  } else {
    // Tous les modeles à partir de la base de données
    Modele.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allModeles) {
        Modele.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('modeles/index', {
              modeles: allModeles,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
            });
          }
        });
      });
  }
});


// CREATE - Ajouter un nouveau modèle à la base de données
router.post('/', middleware.checkAdminAgent , upload.array("image",10),async (req, res,next)  => {

  req.body.modele.author = {
    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email
  };
  Modele.create(req.body.modele, function(err, modele) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/modeles/' + modele._id);
  });

});

// NEW - formulaire de création du modèle
router.get('/new', middleware.checkAdminAgent, (req, res) => {
  res.render('modeles/new');
});

// SHOW - plus d'infos sur le modèle
router.get('/:id', (req, res) => {
  // Find modele with provided ID
  Modele.findById(req.params.id)
    .populate('messages')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundModele) {
      if (err || !foundModele) {
        req.flash('error', 'Modèle non trouvé');
        res.redirect('back');
      } else {
        console.log(foundModele);
        //render show template with that modele
        res.render('modeles/show', {
          modele: foundModele
        });
      }
    });
});

// EDIT MODELE ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, (req, res) => {
  Modele.findById(req.params.id, (err, foundModele) => {
    res.render('modeles/edit', {
      modele: foundModele
    });
  });
});

// UPDATE MODELE ROUTE
router.put('/:id',middleware.checkAdminAgent, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];
    Modele.findById(req.params.id, async function(err, modele) {


      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        if (req.files) {
          try {

            for (var i = 0; i < req.files.length; i++) {
              var locaFilePath = req.files[i].path;
              var result = await uploadToCloudinary(locaFilePath);
              imageUrlList.push(result.url);
              imageIdList.push(result.id);

            }

          } catch (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
        }
        modele.imageId = imageIdList ;
        modele.image = imageUrlList;
        modele.name = req.body.name;
        modele.description = req.body.description;
        modele.save();

        // PARTIE DE LA MISE A JOUR DU MODELE DANS PRODUIT

        produit.find({ },async function(err, foundProduits){

          if((typeof (foundProduits) !="undefined")) {

            foundProduits.forEach(function(foundProduit){

              let mod;

              if( foundProduit.modele.id = modele._id ){

                mod= {
                  id: modele._id,
                  name: modele.name
                };

                produit.findOneAndUpdate(
                  { _id:ObjectId(foundProduit._id)},
                  { $set: { modele: mod }}, {new: true}, (err, doc) => {
                    if (err) {
                      console.log("Erreur");
                    }
                    console.log(doc);
                  });

              }
            });
          }
        });

        // FIN DE LA PARTIE DE LA MISE A JOUR DU MODELE DANS PRODUIT

        req.flash('success', 'Mise à jour réussie!');
        res.redirect('/modeles');
      }
    });
  }
);

// DESTROY MODELE ROUTE
router.delete('/:id', middleware.checkAdminAgent, function(req, res) {
  Modele.findById(req.params.id, function(err, modele) {
    if (err) {
      res.redirect('/modeles');
    } else {

      // PARTIE DE LA SUPPRESSION DU MODELE DANS PRODUITS

      Produit.find({ },async function(err, foundProduits){

        if((typeof (foundProduits) !="undefined")) {

          foundProduits.forEach(function(foundProduit){
            let mod = [];

            if( produit.modele.id = modele._id ){

              Produit.findOneAndUpdate(
                { _id:ObjectId(foundProduit._id)},
                { $set: { modele: mod}}, {new: true}, (err, doc) => {
                  if (err) {
                    console.log("erreur");
                  }
                  console.log(doc);
                });
            }
          });
        }
      });

      // FIN DE LA PARTIE DE LA SUPPRESSION DU MODELE DANS PRODUITS

      //  delete the modele
      modele.remove();
      req.flash('success', 'Modèle supprimé avec succès !');
      res.redirect('/modeles');

    }
  })
});


module.exports = router;
