var express = require('express');
var router = express.Router();
var Campagne = require('../models/campagne');
var Symptome = require('../models/symptome');
var Probleme = require('../models/probleme');
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

  var mainFolderName = "main"
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

//INDEX - Tous les symptomes
router.get('/', function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {

    Symptome.find({
      $or: [
        {
          _id: req.query.search
        }
      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allSymptomes) {
        Symptome.count({
          name: req.query.search
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allSymptomes.length < 1) {
              req.flash(
                'error',
                'Aucun symptôme correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('symptomes/index', {
              symptomes: allSymptomes,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });
  } else {
    // Tous les symptômes à partir de la base de données
    Symptome.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allSymptomes) {
        Symptome.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('symptomes/index', {
              symptomes: allSymptomes,
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

function getProblemes(req,res,next){
  Probleme.find({}, function(err, problemes) {
    if (err) next(err);
    res.locals.problemes = problemes;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// CREATE - Ajouter un nouveau symptôme à la base de données
router.post('/', middleware.checkAdminAgent , upload.array("image",10),async (req, res,next)  => {

  req.body.symptome.author = {

    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email

  };

  // PARTIE DE L'INSERTION DES PROBLEMES

  var cas = req.body.prblms;

  if((typeof (cas) ==="undefined")) {
    cas = "none";
  }

  let prblms = [];
  let vide = [];
  let s;

  Probleme.find({"_id" : {"$in" :cas }},async function(err, foundProblemes){

    if((typeof (foundProblemes) !="undefined") || (cas !=="none")) {

      foundProblemes.forEach(function(foundProbleme){

        s = {
          _id: foundProbleme._id,
          name: foundProbleme.name
        };
        prblms.push(s);
      });
      req.body.symptome.problemes = prblms;
    }else{
      req.body.symptome.problemes = vide;
    }
  Symptome.create(req.body.symptome, function(err, symptome) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/symptomes/' + symptome._id);
  });
 });
});

// NEW - formulaire de création du symptôme
router.get('/new', middleware.checkAdminAgent, getProblemes, (req, res) => {
  res.render('symptomes/new');
});

// SHOW - plus d'infos sur le symptôme
router.get('/:id', (req, res) => {
  // Find symptôme with provided ID
  Symptome.findById(req.params.id)
    .populate('messages')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundSymptome) {
      if (err || !foundSymptome) {
        req.flash('error', 'Symptôme non trouvé');
        res.redirect('back');
      } else {
       //
       let array = [];
       Campagne.find({}, function(err, foundCampagnes) {
        foundCampagnes.forEach(function(foundCampagne){
         foundCampagne.symptomes.forEach(function(symp){
          if(symp._id.toString() === foundSymptome._id.toString()){
            if (!array.includes(foundCampagne)){
              array.push(foundCampagne);
            }
          }
         });
        });
        //
        console.log(foundSymptome);

        //render show template with that symptome
        res.render('symptomes/show', {
          symptome: foundSymptome,
          campagnes: array
        });
       });
      }
    });
});
// EDIT SYMPTOME ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, getProblemes, (req, res) => {
  Symptome.findById(req.params.id, (err, foundSymptome) => {
    res.render('symptomes/edit', {
      symptome: foundSymptome
    });
  });
});

// UPDATE SYMPTOME ROUTE
router.post('/:id',middleware.checkAdminAgent, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];

    Symptome.findById(req.params.id,  async function(err, symptome) {

      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      }else{

      // PARTIE DE LA MISE A JOUR DES PROBLEMES

      var cas = req.body.prblms;

      if((typeof (cas) ==="undefined")) {
        cas = "none";
      }

      let s;
      let prblms = [];

      Probleme.find({"_id" : {"$in": cas }},async function(err, foundProblemes) {

          if((typeof (foundProblemes) !="undefined") || (cas !=="none")) {

            foundProblemes.forEach(function(foundProbleme){

              s = {
                _id: foundProbleme._id,
                name: foundProbleme.name
                };
              prblms.push(s);
            });

            symptome.problemes = prblms;

          };

      // FIN DE LA PARTIE DE LA MISE A JOUR DES PROBLEMES

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

        // PARTIE DE LA MISE A JOUR DU SYMPTOME DANS ANALYSES

        Campagne.find({ },async function(err, foundCampagnes){

          if((typeof (foundCampagnes) !="undefined")) {

            foundCampagnes.forEach(function(foundCampagne){
              let s;
              let smps = [];
              foundCampagne.symptomes.forEach(function(smp){


                if( symptome.id != smp._id ){

                  s = {
                    _id: smp._id,
                    name: smp.name
                  };

                  smps.push(s);

                }else{

                  if( symptome.id = smp._id ){

                    s = {
                      _id: symptome._id,
                      name: req.body.name
                    };

                    smps.push(s);
                  }
                }
              });

              Campagne.findOneAndUpdate(
                { _id:ObjectId(foundCampagne._id)},
                { $set: { symptomes: smps}}, {new: true}, (err, doc) => {
                  if (err) {
                    console.log("Erreur");
                  }
                  console.log(doc);

                });

            });

          }

        });

        // FIN DE LA PARTIE DE LA MISE A JOUR DU SYMPTOME DANS ANALYSES

        symptome.imageId = imageIdList ;
        symptome.image = imageUrlList;
        symptome.name = req.body.name;
        symptome.description = req.body.description;
        symptome.save();

        req.flash('success', 'Symptôme mis à jour avec succès !');
        res.redirect('/symptomes');

        }
      });
     }
   });

  });

// DESTROY SYMPTOME ROUTE

router.delete('/:id', middleware.checkAdminAgent, (req, res) => {

  Symptome.findById(req.params.id, function(err, symptome) {
    if (err) {
      res.redirect('/symptomes');
    } else {

      // PARTIE DE LA SUPPRESSION DU SYMPTOME DANS CAMPAGNES

      Campagne.find({ },async function(err, foundCampagnes){

        if((typeof (foundCampagnes) !="undefined")) {

         foundCampagnes.forEach(function(foundCampagne){
           let s;
           let smps = [];

           foundCampagne.symptomes.forEach(function(smp){

             if( symptome.id != smp._id ){

               s = {
                _id: smp._id,
                name: smp.name
                };

             smps.push(s);

             }

          });

           Campagne.findOneAndUpdate(
             { _id:ObjectId(foundCampagne._id)},
             { $set: { symptomes: smps}}, {new: true}, (err, doc) => {
               if (err) {
                 console.log("erreur");
               }

               console.log(doc);
             });
          });
        }

      });

      //  Supprimer le symptôme
      symptome.remove();
      req.flash('success', 'Symptôme supprimé avec succès !');
      res.redirect('/symptomes');

    }
  })
});

module.exports = router;
