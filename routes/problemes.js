var express = require('express');
var router = express.Router();
var Symptome = require('../models/symptome');
var Probleme = require('../models/probleme');
var Plant = require('../models/plant');
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

//INDEX - Tous les problèmes
router.get('/', function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {


    Probleme.find({
      $or: [
        {
          name: req.query.search
        }
      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allProblemes) {
        Probleme.count({
          name: req.query.search
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allProblemes.length < 1) {
              req.flash(
                'error',
                'Aucun problème correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('problemes/index', {
              problemes: allProblemes,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });
  } else {
    // Tous les problèmes à partir de la base de données
    Probleme.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allProblemes) {
        Probleme.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('problemes/index', {
              problemes: allProblemes,
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

function getPlants(req,res,next){
  Plant.find({}, function(err, plants) {
    if (err) next(err);
    res.locals.plants = plants;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// CREATE - Ajouter un nouveau symptôme à la base de données
router.post('/', middleware.checkAdminAgent , upload.array("image",10),async (req, res,next)  => {

  req.body.probleme.author = {

    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email

  };

  // PARTIE DE L'INSERTION DES PLANTS DE TESTS

  var cas = req.body.plants;

  if((typeof (cas) ==="undefined")) {
    cas = "none";
  }

  let plnts = [];
  let vide = [];
  let s;

  Plant.find({"_id" : {"$in" :cas }},async function(err, foundPlants){

    if((typeof (foundPlants) !="undefined") || (cas !=="none")) {

      foundPlants.forEach(function(foundPlant){

        s = {
          _id: foundPlant._id,
          name: foundPlant.name
        };
        plnts.push(s);
      });
      req.body.probleme.plants = plnts;
    }else{
      req.body.probleme.plants = vide;
    }
    Probleme.create(req.body.probleme, function(err, probleme) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/problemes/' + probleme._id);
    });
  });
});

// NEW - formulaire de création du problème
router.get('/new', middleware.checkAdminAgent, getPlants, (req, res) => {
  res.render('problemes/new');
});

// SHOW - plus d'infos sur le problème
router.get('/:id', (req, res) => {
  // Find symptôme with provided ID
  Probleme.findById(req.params.id)
    .populate('messages')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundProbleme) {
      if (err || !foundProbleme) {
        req.flash('error', 'Problème non trouvé');
        res.redirect('back');
      } else {
        //
        let array = [];
        Symptome.find({}, function(err, foundSymptomes) {
          foundSymptomes.forEach(function(foundSymptome){
            foundSymptome.problemes.forEach(function(prb){
              if(prb._id.toString() === foundProbleme._id.toString()){
                if (!array.includes(foundSymptome)){
                  array.push(foundSymptome);
                }
              }
            });
          });
          //
        console.log(foundProbleme);
        //render show template with that probleme
        res.render('problemes/show', {
          probleme: foundProbleme,
          symptomes: array
        });
       });
      }
    });
});
// EDIT PROBLEME ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, getPlants, (req, res) => {
  Probleme.findById(req.params.id, (err, foundProbleme) => {
    res.render('problemes/edit', {
      probleme: foundProbleme
    });
  });
});

// UPDATE SYMPTOME ROUTE
router.post('/:id',middleware.checkAdminAgent, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];

    Probleme.findById(req.params.id,  async function(err, probleme) {

      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      }else{

        // PARTIE DE LA MISE A JOUR DES PLANTS DE TESTS

        var cas = req.body.plants;

        if((typeof (cas) ==="undefined")) {
          cas = "none";
        }

        let s;
        let plnts = [];

        Plant.find({"_id" : {"$in": cas }},async function(err, foundPlants) {

          if((typeof (foundPlants) !="undefined") || (cas !=="none")) {

            foundPlants.forEach(function(foundPlant){

              s = {
                _id: foundPlant._id,
                name: foundPlant.name
              };
              plnts.push(s);
            });

            probleme.plants = plnts;

          };

        // FIN DE LA PARTIE DE LA MISE A JOUR DES PLANS DE TESTS

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

          // PARTIE DE LA MISE A JOUR DU PROBLEME DANS SYMPTOMES

          Symptome.find({ },async function(err, foundSymptomes){

            if((typeof (foundSymptomes) !="undefined")) {

              foundSymptomes.forEach(function(foundSymptome){
                let s;
                let prblms = [];
                foundSymptome.problemes.forEach(function(prb){


                  if( probleme.id != prb._id ){

                    s = {
                      _id: prb._id,
                      name: prb.name
                    };

                    prblms.push(s);

                  }else{

                    if(probleme.id = prb._id ){

                      s = {
                        _id: probleme._id,
                        name: req.body.name
                      };

                      prblms.push(s);
                    }
                  }
                });

                Symptome.findOneAndUpdate(
                  { _id:ObjectId(foundSymptome._id)},
                  { $set: { problemes: prblms}}, {new: true}, (err, doc) => {
                    if (err) {
                      console.log("Erreur");
                    }
                    console.log(doc);

                  });

              });

            }

          });

          // FIN DE LA PARTIE DE LA MISE A JOUR DU PROBLEME DANS SYMPTOME

          probleme.imageId = imageIdList ;
          probleme.image = imageUrlList;
          probleme.name = req.body.name;
          probleme.description = req.body.description;
          probleme.save();

          req.flash('success', 'Problème mis à jour avec succès !');
          res.redirect('/problemes');

        }
      });
      }
    });
  });

// DESTROY PROBLEME ROUTE

router.delete('/:id', middleware.checkAdminAgent, (req, res) => {

  Probleme.findById(req.params.id, function(err, probleme) {
    if (err) {
      res.redirect('/problemes');
    } else {

      // PARTIE DE LA SUPPRESSION DU PROBLEME DANS SYMPTOMES

      Symptome.find({ },async function(err, foundSymptomes){

        if((typeof (foundSymptomes) !="undefined")) {

          foundSymptomes.forEach(function(foundSymptome){
            let s;
            let prblms = [];

            foundSymptome.problemes.forEach(function(prb){

              if( probleme.id != prb._id ){

                s = {
                  _id: prb._id,
                  name: prb.name
                };

                prblms.push(s);

              }

            });

            Symptome.findOneAndUpdate(
              { _id:ObjectId(foundSymptome._id)},
              { $set: { problemes: prblms}}, {new: true}, (err, doc) => {
                if (err) {
                  console.log("erreur");
                }

                console.log(doc);
              });
          });
        }

      });

      //  Supprimer le problème
      probleme.remove();
      req.flash('success', 'Problème supprimé avec succès !');
      res.redirect('/symptomes');

    }
  })
});

module.exports = router;
