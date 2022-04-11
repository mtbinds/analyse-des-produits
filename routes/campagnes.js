var express = require('express');
var router = express.Router();
var Campagne = require('../models/campagne');
var middleware = require('../middleware');
var Produit = require('../models/produit');
var Symptome = require('../models/symptome');

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

//INDEX - Toutes les campagnes de tests
router.get('/', function(req, res) {

  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;


  if (req.query.search) {

    Produit.findOne({ imei : req.query.search }, function(err, foundProduit){

    Campagne.find(
        { $and: [
            {
              imei: foundProduit.imei
            },
            {
              createdAt: {
                $gte: req.query.date_begin,
                $lt: req.query.date_end
              }
            },

          ]})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allCampagnes) {
        Campagne.count({
         name: req.query.search

        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allCampagnes.length < 1) {
              req.flash(
                'error',
                'Aucune campagne de tests correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }

            res.render('campagnes/index', {
              campagnes: allCampagnes,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });

  });

  } else {
    // Toutes les campagnes de test à partir de la base de données
    Campagne.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allCampagnes) {
        Campagne.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('campagnes/index', {
              campagnes: allCampagnes,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
            });
          }
        });
      });
  }

});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function getSymptomes(req,res,next){
  Symptome.find({}, function(err, symptomes) {
    if (err) next(err);
    res.locals.symptomes = symptomes;
    next();
  });
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getProduits(req,res,next){
  Produit.find({}, function(err, produits) {
    if (err) next(err);
    res.locals.produits = produits;
    next();
  });
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// CREATE - Ajouter une nouvelle campagne de tests à la base de données
router.post('/', middleware.checkAdminAgent, upload.array("image",10),async (req, res,next)  => {

  var imageUrlList = [];
  var imageIdList = [];

  for (var i = 0; i < req.files.length; i++) {
    var locaFilePath = req.files[i].path;
    var result = await uploadToCloudinary(locaFilePath);
    imageUrlList.push(result.url);
    imageIdList.push(result.id);

  }

  req.body.campagne.image = imageUrlList;
  req.body.campagne.imageId = imageIdList;
  req.body.campagne.author = {
    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email
  };

  // PARTIE DE L'INSERTION DE PRODUIT

  var cass = req.body.prod;

  if((typeof (cass) ==="undefined")) {
    cass = "none";
  }

  Produit.findById(cass, function(err, foundProduit){

    req.body.campagne.produit = {
      id: foundProduit._id,
      imei: foundProduit.imei,
      name: foundProduit.name

    };
    req.body.campagne.imei = foundProduit.imei;



  // PARTIE DE L'INSERTION DES SYMPTOMES

  var cas = req.body.symps;


  if((typeof (cas) ==="undefined")) {
    cas = "none";
  }

  let symptms = [];
  let vide = [];
  let s;

  Symptome.find({"_id" : {"$in" :cas }},async function(err, foundSymptomes){

    if((typeof (foundSymptomes) !="undefined") || (cas !=="none")) {

      foundSymptomes.forEach(function(foundSymptome){

        s = {
          _id: foundSymptome._id,
          name: foundSymptome.name
        };
        symptms.push(s);
      });
      req.body.campagne.symptomes = symptms;
    }else{
      req.body.campagne.symptomes = vide;
    }

    Campagne.create(req.body.campagne, function(err, campagne) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }else{
        res.redirect('/campagnes/' + campagne._id);
      }

    });
  });
 });
});

// NEW - formulaire d'ajout de la campagne
router.get('/new', middleware.checkAdminAgent, getSymptomes, getProduits, (req, res) => {
  res.render('campagnes/new');
});

// SHOW - plus d'infos sur le campagne
router.get('/:id', getProduits, (req, res) => {
  // Find campagne with provided ID
  Campagne.findById(req.params.id)
    .populate('comments messages likes')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundCampagne) {
      if (err || !foundCampagne) {
        req.flash('error', 'Campagne de tests non trouvée');
        res.redirect('back');
      } else {
        console.log(foundCampagne);
        //render show template with that campagne de tests
        res.render('campagnes/show', {
          campagne: foundCampagne
        });
      }
    });
});

// EDIT CAMPAGNE DE TESTS ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, getSymptomes, getProduits, (req, res) => {
  Campagne.findById(req.params.id, (err, foundCampagne) => {
    res.render('campagnes/edit', {
      campagne: foundCampagne
    });
  });
});

// UPDATE CAMPAGNE DE TESTS ROUTE
router.put('/:id', middleware.checkAdminAgent, getProduits, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];
    Campagne.findById(req.params.id, async function(err, campagne) {

      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      } else {

        // PARTIE DE LA MISE A JOUR DE PRODUIT DANS CAMPAGNE DE TESTS

        var cass = req.body.prod;

        if((typeof (cass) ==="undefined")) {
          cass = "none";
        }

        Produit.findById(cass, function(err, foundProduit){

          campagne.produit = {
            id: foundProduit._id,
            imei: foundProduit.imei,
            name: foundProduit.name
          };

          campagne.imei = foundProduit.imei;

        // PARTIE DE L'INSERTION DES SYMPTOMES DANS CAMPAGNE DE TESTS

        var cas = req.body.symps;

        if((typeof (cas) ==="undefined")) {
          cas = "none";
        }

        let s;
        let symps = [];
        let vide = [];


        Symptome.find({"_id" : {"$in": cas }},async function(err, foundSymptomes){

          if((typeof (foundSymptomes) !="undefined") || (cas !=="none")) {

            foundSymptomes.forEach(function(foundSymptome){

              s = {
                _id: foundSymptome._id,
                name: foundSymptome.name
              };
              symps.push(s);
            });

            campagne.symptomes = symps;
          }else{
            campagne.problemes = vide;
          }

          if ((typeof (req.body.name) !=="undefined") || (typeof (req.body.description) !=="undefined")){

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
            campagne.name = req.body.name;
            campagne.description = req.body.description;
            campagne.save();
            req.flash('success', 'Mise à jour réussie!');
            res.redirect('/campagnes');
          }
        });
       });
      }
    });
  });

// DESTROY CAMPAGNE DE TESTS ROUTE
router.delete('/:id', middleware.checkAdminAgent, function(req, res) {
  Campagne.findById(req.params.id, function(err, campagne) {
    if (err) {
      res.redirect('/campagnes');
    } else {
      //  delete the campagne
      campagne.remove();
      req.flash('success', 'Campagne de tests supprimée avec succès !');
      res.redirect('/campagnes');

     }
  });
});


module.exports = router;
