var express = require('express');
var router = express.Router();
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

//INDEX - Tous les tests
router.get('/', function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if (req.query.search) {

    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Test.find({
      $or: [
        {
          name: req.query.search
        }

      ]
    })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allTests) {
        Test.count({
          name: req.query.search
        }).exec(function(err, count) {
          if (err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {

            if (allTests.length < 1) {
              req.flash(
                'error',
                'Aucun test correspond à votre recherche, Réessayez svp.'
              );
              return res.redirect('back');
            }
            res.render('tests/index', {
              tests: allTests,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search
            });
          }
        });
      });
  } else {
    // Tous les tests à partir de la base de données
    Test.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function(err, allTests) {
        Test.count().exec(function(err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render('tests/index', {
              tests: allTests,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false
            });
          }
        });
      });
  }
});


// CREATE - Ajouter un nouveau tests à la base de données
router.post('/', middleware.checkAdminAgent , upload.array("image",10),async (req, res,next)  => {

  req.body.test.author = {
    id: req.user._id,
    username: req.user.username,
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    role: req.user.role,
    email: req.user.email
  };
  Test.create(req.body.test, function(err, test) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/tests/' + test._id);
  });

});

// NEW - formulaire de création du test
router.get('/new', middleware.checkAdminAgent, (req, res) => {
  res.render('tests/new');
});


// SHOW - plus d'infos sur le test
router.get('/:id', (req, res) => {
  // Find test with provided ID
  Test.findById(req.params.id)
    .populate('messages')
    .populate({
      path: 'reviews',
      options: {
        sort: {
          createdAt: -1
        }
      }
    })
    .exec(function(err, foundTest) {
      if (err || !foundTest) {
        req.flash('error', 'Test non trouvé');
        res.redirect('back');
      } else {
        //
        let array = [];
        Plant.find({}, function(err, foundPlants) {
          foundPlants.forEach(function(foundPlant){
            foundPlant.tests.forEach(function(tst){
              if(tst._id.toString() === foundTest._id.toString()){
                if (!array.includes(foundPlant)){
                  array.push(foundPlant);
                }
              }
            });
          });
          //
        console.log(foundTest);
        //render show template with that test
        res.render('tests/show', {
          test: foundTest,
          plants: array
        });
       });
      }
    });
});

// EDIT TEST ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, (req, res) => {
  Test.findById(req.params.id, (err, foundTest) => {
    res.render('tests/edit', {
      test: foundTest
    });
  });
});

// UPDATE TEST ROUTE
router.post('/:id',middleware.checkAdminAgent, upload.array('image',10),
  (req, res) => {

    var imageUrlList = [];
    var imageIdList = [];
    Test.findById(req.params.id, async function(err, test) {


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
        test.imageId = imageIdList ;
        test.image = imageUrlList;
        test.name = req.body.name;
        test.description = req.body.description;
        test.save();

        // PARTIE DE LA MISE A JOUR DU TEST DANS PLANS DE TESTS

        Plant.find({ },async function(err, foundPlants){

          if((typeof (foundPlants) !="undefined")) {

            foundPlants.forEach(function(foundPlant){
              let s;
              let tsts = [];
              foundPlant.tests.forEach(function(tst){


                if( test.id != tst._id ){

                  s = {
                    _id: tst._id,
                    name: tst.name
                  };

                  tsts.push(s);

                }else{

                  if( test.id = tst._id ){

                    s = {
                      _id: test._id,
                      name: req.body.name
                    };

                    tsts.push(s);
                  }
                }
              });

              Plant.findOneAndUpdate(
                { _id:ObjectId(foundPlant._id)},
                { $set: { tests: tsts}}, {new: true}, (err, doc) => {
                  if (err) {
                    console.log("Erreur");
                  }
                  console.log(doc);

                });

            });

          }

        });

        // FIN DE LA PARTIE DE LA MISE A JOUR DU TEST DANS PLANS DE TESTS


        req.flash('success', 'Mise à jour réussie!');
        res.redirect('/tests');
      }
    });
  }
);

// DESTROY TEST ROUTE
router.delete('/:id', middleware.checkAdminAgent, function(req, res) {
  Test.findById(req.params.id, function(err, test) {
    if (err) {
      res.redirect('/tests');
    } else {

      // PARTIE DE LA SUPPRESSION DU TEST DANS PLANS DE TESTS

      Plant.find({ },async function(err, foundPlants){

        if((typeof (foundPlants) !="undefined")) {

          foundPlants.forEach(function(foundPlant){
            let s;
            let tsts = [];

            foundPlant.tests.forEach(function(tst){

              if( test.id != tst._id ){

                s = {
                  _id: tst._id,
                  name: tst.name
                };

                tsts.push(s);

              }

            });

            Plant.findOneAndUpdate(
              { _id:ObjectId(foundPlant._id)},
              { $set: { tests: tsts}}, {new: true}, (err, doc) => {
                if (err) {
                  console.log("erreur");
                }

                console.log(doc);
              });
          });
        }

      });

      // FIN DE LA PARTIE DE LA SUPPRESSION DU TEST DANS PLANS DE TESTS

      //  delete the test
      test.remove();
      req.flash('success', 'Test supprimé avec succès !');
      res.redirect('/tests');

    }
  })
});

module.exports = router;
