var express = require('express');
var router = express.Router();
var Produit = require('../models/produit');
var Type = require('../models/type');
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
const {ObjectId} = require("bson");
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

//INDEX - Tous les types
router.get('/', function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {

    Type.find({
      $or: [
        {
          name:req.query.search
        }
      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allTypes) {
        Type.count({
          name:req.query.search
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allTypes.length < 1) {
              req.flash(
                'error',
                'Aucun type correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('types/index', {
              types: allTypes,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });
  } else {
    // Tous les types à partir de la base de données
    Type.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allTypes) {
        Type.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('types/index', {
              types: allTypes,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
            });
          }
        });
      });
  }
});


// CREATE - Ajouter un nouveau types à la base de données
router.post('/', middleware.checkAdminAgent , upload.array("image",10),async (req, res,next)  => {

  req.body.type.author = {
    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email
  };
  Type.create(req.body.type, function(err, type) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/types/' + type._id);
  });

});

// NEW - formulaire de création du type
router.get('/new', middleware.checkAdminAgent, (req, res) => {
  res.render('types/new');
});

// SHOW - plus d'infos sur le type
router.get('/:id', (req, res) => {
  // Find type with provided ID
  Type.findById(req.params.id)
    .populate('messages')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundType) {
      if (err || !foundType) {
        req.flash('error', 'Type non trouvé');
        res.redirect('back');
      } else {
        console.log(foundType);
        //render show template with that type
        res.render('types/show', {
          type: foundType
        });
      }
    });
});

// EDIT TYPE ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, (req, res) => {
  Type.findById(req.params.id, (err, foundType) => {
    res.render('types/edit', {
      type: foundType
    });
  });
});

// UPDATE TYPE ROUTE
router.post('/:id',middleware.checkAdminAgent, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];

    Type.findById(req.params.id, async function(err, type) {
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
        type.imageId = imageIdList ;
        type.image = imageUrlList;
        type.name = req.body.name;
        type.description = req.body.description;
        type.save();

        // PARTIE DE LA MISE A JOUR DU TYPE DANS PRODUIT

        Produit.find({ },async function(err, foundProduits){

          if((typeof (foundProduits) !="undefined")) {

            foundProduits.forEach(function(foundProduit){

              let ty;

              if( foundProduit.type.id == type._id ){

                ty= {
                  id: type._id,
                  name: type.name
                };

                Produit.findOneAndUpdate(
                  { _id:ObjectId(foundProduit._id)},
                  { $set: { type: ty }}, {new: true}, (err, doc) => {
                    if (err) {
                      console.log("Erreur");
                    }
                    console.log(doc);
                  });

              }
            });
          }
        });
        // FIN DE LA PARTIE DE LA MISE A JOUR DU TYPE DANS PRODUIT
        req.flash('success', 'Mise à jour réussie !');
        res.redirect('/types');
      }
    });
  }
);

// DESTROY TYPE ROUTE
router.delete('/:id', middleware.checkAdminAgent, function(req, res) {
  Type.findById(req.params.id, function(err, type) {
    if (err) {
      res.redirect('/types');
    } else {

      // PARTIE DE LA SUPPRESSION DU TYPE DANS PRODUITS

      Produit.find({ },async function(err, foundProduits){

        if((typeof (foundProduits) !="undefined")) {

          foundProduits.forEach(function(foundProduit){
            let ty = [];

              if(foundProduit.type.id == type._id ){

                Produit.findOneAndUpdate(
                  { _id:ObjectId(foundProduit._id)},
                  { $set: { type: ty}}, {new: true}, (err, doc) => {
                    if (err) {
                      console.log("erreur");
                    }
                    console.log(doc);
                  });
               }
          });
        }
      });

      // FIN DE LA PARTIE DE LA SUPPRESSION DU TYPE DANS PRODUITS

      //  delete the type
      type.remove();
      req.flash('success', 'Type supprimé avec succès !');
      res.redirect('/types');

    }
  })
});

module.exports = router;
