var express = require('express');
var router = express.Router();
var Probleme = require('../models/probleme');
var Plant = require('../models/plant');
var Test = require('../models/test');
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

//INDEX - Tous les plan de tests
router.get('/', function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {

    Plant.find({
      $or: [
        {
          name: req.query.search
        }
      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allPlants) {
        Plant.count({
          name: req.query.search
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allPlants.length < 1) {
              req.flash(
                'error',
                'Aucun plan de tests correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('plants/index', {
              plants: allPlants,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });
  } else {
    // Tous les plan de testss à partir de la base de données
    Plant.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allPlants) {
        Plant.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('plants/index', {
              plants: allPlants,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
            });
          }
        });
      });
  }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getTests(req,res,next){
  Test.find({}, function(err, tests) {
    if (err) next(err);
    res.locals.tests = tests;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// CREATE - Ajouter un nouveau plan de tests à la base de données
router.post('/', middleware.checkAdminAgent , upload.array("image",10),async (req, res,next)  => {

  req.body.plant.author = {

    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email

  };

  // PARTIE DE L'INSERTION DES TESTS

  var cas = req.body.tests;

  if((typeof (cas) ==="undefined")) {
    cas = "none";
  }

  let tsts = [];
  let vide = [];
  let s;

  Test.find({"_id" : {"$in" :cas }},async function(err, foundTests){

    if((typeof (foundTests) !="undefined") || (cas !=="none")) {

      foundTests.forEach(function(foundTest){

        s = {
          _id: foundTest._id,
          name: foundTest.name
        };
        tsts.push(s);
      });
      req.body.plant.tests = tsts;
    }else{
      req.body.plant.tests = vide;
    }
    Plant.create(req.body.plant, function(err, plant) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/plants/' + plant._id);
    });
  });
});

// NEW - formulaire de création du plan de tests
router.get('/new', middleware.checkAdminAgent, getTests, (req, res) => {
  res.render('plants/new');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getProblemes(req,res,next){

  Probleme.find({}, function(err, foundProblemes) {
    if (err) next(err);
    res.locals.problemes = foundProblemes;
    next();
  });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// SHOW - plus d'infos sur le plan de tests
router.get('/:id', getProblemes, (req, res) => {
  // Find plan de tests with provided ID
  Plant.findById(req.params.id)
    .populate('messages')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundPlant) {
      if (err || !foundPlant) {
        req.flash('error', 'Plan de tests non trouvé');
        res.redirect('back');
      } else {
        //
        let array = [];
        Probleme.find({}, function(err, foundProblemes) {
          foundProblemes.forEach(function(foundProbleme){
            foundProbleme.plants.forEach(function(plt){
              if(plt._id.toString() === foundPlant._id.toString()){
                if (!array.includes(foundProbleme)){
                  array.push(foundProbleme);
                }
              }
            });
          });
          //
        console.log(foundPlant);
        //render show template with that plant
        res.render('plants/show', {
          plant: foundPlant,
          problemes: array
        });
       });
      }
    });
});
// EDIT PLAN DE TESTS ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, getTests, (req, res) => {
  Plant.findById(req.params.id, (err, foundPlant) => {
    res.render('plants/edit', {
      plant: foundPlant
    });
  });
});

// UPDATE PLAN DE TESTS ROUTE
router.post('/:id',middleware.checkAdminAgent, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];

    Plant.findById(req.params.id,  async function(err, plant) {

      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      }else{

        // PARTIE DE LA MISE A JOUR DES TESTS

        var cas = req.body.tests;

        if((typeof (cas) ==="undefined")) {
          cas = "none";
        }

        let s;
        let tsts = [];

        Test.find({"_id" : {"$in": cas }},async function(err, foundTests) {

          if((typeof (foundTests) !="undefined") || (cas !=="none")) {

            foundTests.forEach(function(foundTest){

              s = {
                _id: foundTest._id,
                name: foundTest.name
              };
              tsts.push(s);
            });

            plant.tests = tsts;

          };

          // FIN DE LA PARTIE DE LA MISE A JOUR DES TESTS

          if ( (typeof (req.body.name) !=="undefined") || (typeof (req.body.description) !=="undefined")){

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

            // PARTIE DE LA MISE A JOUR DU PLAN DE TESTS DANS ANALYSES

            Probleme.find({ },async function(err, foundProblemes){

              if((typeof (foundProblemes) !="undefined")) {

                foundProblemes.forEach(function(foundProbleme){
                  let s;
                  let plts = [];
                  foundProbleme.plants.forEach(function(plt){


                    if( plant.id != plt._id ){

                      s = {
                        _id: plt._id,
                        name: plt.name
                      };

                      plts.push(s);

                    }else{

                      if( plant.id = plt._id ){

                        s = {
                          _id: plant._id,
                          name: req.body.name
                        };

                        plts.push(s);
                      }
                    }
                  });

                  Probleme.findOneAndUpdate(
                    { _id:ObjectId(foundProbleme._id)},
                    { $set: { plants: plts}}, {new: true}, (err, doc) => {
                      if (err) {
                        console.log("Erreur");
                      }
                      console.log(doc);

                    });

                });

              }

            });

            // FIN DE LA PARTIE DE LA MISE A JOUR DU PLAN DE TESTS DANS ANALYSE

            plant.imageId = imageIdList ;
            plant.image = imageUrlList;
            plant.name = req.body.name;
            plant.description = req.body.description;
            plant.save();

            req.flash('success', 'Plan de tests mis à jour avec succès !');
            res.redirect('/plants');

          }
        });
      }
    });

  });

// DESTROY PLAN DE TESTS ROUTE

router.delete('/:id', middleware.checkAdminAgent, (req, res) => {

  Plant.findById(req.params.id, function(err, plant) {
    if (err) {
      res.redirect('/plants');
    } else {

      // PARTIE DE LA SUPPRESSION DU PLAN DE TESTS DANS PROBLEMES

      Probleme.find({ },async function(err, foundProblemes){

        if((typeof (foundProblemes) !="undefined")) {

          foundProblemes.forEach(function(foundProbleme){
            let s;
            let plts = [];

            foundProbleme.plants.forEach(function(plt){

              if( plant.id != plt._id ){

                s = {
                  _id: plt._id,
                  name: plt.name
                };

                plts.push(s);

              }

            });

            Probleme.findOneAndUpdate(
              { _id:ObjectId(foundProbleme._id)},
              { $set: { plants: plts}}, {new: true}, (err, doc) => {
                if (err) {
                  console.log("erreur");
                }

                console.log(doc);
              });
          });
        }

      });

      //  Supprimer le plan de tests
      plant.remove();
      req.flash('success', 'Plan de tests supprimé avec succès !');
      res.redirect('/plants');

    }
  })
});

module.exports = router;
