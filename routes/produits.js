var express = require('express');
var router = express.Router();
var Produit = require('../models/produit');
var Type = require('../models/type');
var Modele = require('../models/modele');
var middleware = require('../middleware');
var Comment = require('../models/comment')
var Review = require('../models/review');
var Campagne = require('../models/campagne');
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


//INDEX - Tous les produits
router.get('/', getCampagnes, function(req, res) {
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	if (req.query.search) {

		Produit.find({
			$or: [

        {
          imei: req.query.search
        }

			]
		})
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function(err, allProduits) {
				Produit.count({
					imei: req.query.search
				}).exec(function(err, count) {
					if (err) {
						req.flash('error', err.message);
						res.redirect('back');
					} else {

						if (allProduits.length < 1) {
							req.flash(
								'error',
								'Aucun produit correspond à votre recherche, Réessayez svp.'
							);
							return res.redirect('back');
						}
						res.render('produits/index', {
							produits: allProduits,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							search: req.query.search
						});
					}
				});
			});
	} else {
		// Tous les produits à partir de la base de données
		Produit.find({})
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function(err, allProduits) {
				Produit.count().exec(function(err, count) {
					if (err) {
						console.log(err);
					} else {
						res.render('produits/index', {
							produits: allProduits,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							search: false
						});
					}
				});
			});
	}
});



// CREATE - Ajouter un nouveau produit à la base de données
router.post('/', middleware.checkAdminAgent, upload.array("image",10),async (req, res,next)  => {

  var imageUrlList = [];
  var imageIdList = [];

  for (var i = 0; i < req.files.length; i++) {
    var locaFilePath = req.files[i].path;
    var result = await uploadToCloudinary(locaFilePath);
    imageUrlList.push(result.url);
    imageIdList.push(result.id);

  }

    req.body.produit.image = imageUrlList;
    req.body.produit.imageId = imageIdList;
    req.body.produit.author = {
			id: req.user._id,
			username: req.user.username,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      role: req.user.role,
      email: req.user.email
		};

    // PARTIE DE L'INSERTION DE PRODUIT

    Type.findById(req.body.type, function(err, foundType) {


        req.body.produit.type = {
          id: foundType._id,
          name: foundType.name
        };

        console.log("TYPE");
        console.log(req.body.produit.type);



    Modele.findById(req.body.modele, function(err, foundModele) {

        req.body.produit.modele = {
          id: foundModele._id,
          name: foundModele.name
        };



  console.log("Maxy")
  console.log(req.body.produit);

  Produit.create(req.body.produit, function(err, produit) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}else{
			res.redirect('/produits/' + produit._id);
      }
		});
   });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getTypes(req,res,next){
  Type.find({}, function(err, types) {
    if (err) next(err);
    res.locals.types = types;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getModeles(req,res,next){
  Modele.find({}, function(err, modeles) {
    if (err) next(err);
    res.locals.modeles = modeles;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// NEW - formulaire de création du produit
router.get('/new', middleware.checkAdminAgent, getTypes, getModeles, (req, res) => {
	res.render('produits/new');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getCampagnes(req,res,next){
  Campagne.find({}, function(err, campagnes) {
    if (err) next(err);
    res.locals.campagnes = campagnes;
    next();
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// SHOW - plus d'infos sur le produit
router.get('/:id', (req, res) => {
	// Find produit with provided ID
	Produit.findById(req.params.id)
		.populate('comments messages likes')
		.populate({
			path: 'reviews',
			options: {
				sort: {
					createdAt: -1
				}
			}
		})
		.exec(function(err, foundProduit) {
			if (err || !foundProduit) {
				req.flash('error', 'Produit non trouvé');
				res.redirect('back');
			} else {

       if (req.query.search) {

        Campagne.find( {$and: [

          {
            imei: foundProduit.imei
          },
          {
            createdAt: {
              $gte: req.query.date_begin,
              $lt: req.query.date_end
             }
          }
        ]}, function(err, foundCampagnes) {

				 console.log(foundProduit);
         console.log(foundCampagnes);
				 //render show template with that produit
				 res.render('produits/show', {
					 produit: foundProduit,
           campagnes: foundCampagnes
				 });
       });

       } else {

         let liste=[];
         let filtered_liste=[];

         Campagne.find(
             {
               imei: foundProduit.imei
             }, function(err, foundCampagnes) {

           foundCampagnes.forEach(function(foundCampagne){
             foundCampagne.symptomes.forEach(function(symptome){
             if(liste.length >= 1){
                 liste.push(symptome);
             }else{
                 liste.push(symptome);
             }
            });
           });
           // Le filtrage de notre liste
           liste.forEach(function(symptome){
             if(filtered_liste.length === 0){
               filtered_liste.push(symptome);
             }else{
               let test = false;
               for(let i=0; i < filtered_liste.length; i++){
                 if (symptome.equals(filtered_liste[i])){
                   test = true;
                 }
               }
               if(test === false){
                 filtered_liste.push(symptome);
               }
             }
           });

           console.log(foundProduit);
           console.log(foundCampagnes);
           //render show template with that produit
           res.render('produits/show', {
             produit: foundProduit,
             campagnes: foundCampagnes,
             symptomes: filtered_liste
           });
         });
       }
			}
		});
});

// EDIT PRODUIT ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, getTypes, getModeles, (req, res) => {
	Produit.findById(req.params.id, (err, foundProduit) => {
		res.render('produits/edit', {
			produit: foundProduit
		});
	});
});

// UPDATE PRODUIT ROUTE
router.put('/:id', middleware.checkAdminAgent, upload.array('image',10),
	(req, res) => {

    var imageUrlList = [];
    var imageIdList = [];
		Produit.findById(req.params.id, async function(err, produit) {

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

        produit.imageId = imageIdList ;
        produit.image = imageUrlList;
        produit.name = req.body.name;
        produit.description = req.body.description;
        produit.status = req.body.status;
        produit.publication = req.body.publication;


				// MISE A JOUR DU TYPE ET MODELE
        Type.findById(req.body.type, function(err, type) {

          produit.type = {
            id: type._id,
            name: type.name
          };

				Modele.findById(req.body.modele, function(err, modele) {

          produit.modele = {
            id: modele._id,
            name: modele.name
          };

        produit.save();

        // PARTIE DE LA MISE A JOUR DU PRODUIT DANS ANALYSE

        Campagne.find({ },async function(err, foundCampagnes){

          if((typeof (foundCampagnes) !="undefined")) {

            foundCampagnes.forEach(function(foundCampagne){

              let prod;

              if( foundCampagne.produit.id = produit._id ){

                prod = {
                  id: produit._id,
                  imei: produit.imei,
                  name: produit.name
                };

                Campagne.findOneAndUpdate(
                  { _id:ObjectId(foundCampagne._id)},
                  { $set: { produit: prod }}, {new: true}, (err, doc) => {
                    if (err) {
                      console.log("Erreur");
                    }
                    console.log(doc);
                  });
                // MISE A JOUR DE L'IMEI DE L'ANALYSE
                Campagne.findOneAndUpdate(
                  { _id:ObjectId(foundCampagne._id)},
                  { $set: { imei: produit.imei }}, {new: true}, (err, doc) => {
                    if (err) {
                      console.log("Erreur");
                    }
                    console.log(doc);
                  });

              }
            });
          }
        });

        // FIN DE LA PARTIE DE LA MISE A JOUR DU PRODUIT DANS ANALYSE

        req.flash('success', 'Mise à jour réussie!');
				res.redirect('/produits');

        });
      });
     }
	});
});



// DESTROY PRODUIT ROUTE
router.delete('/:id', middleware.checkAdminAgent, function(req, res) {
	Produit.findById(req.params.id, function(err, produit) {
		if (err) {
			res.redirect('/produits');
		} else {
			// deletes all comments associated with the produit
			Comment.remove(
				{
					_id: {
						$in: produit.comments
					}
				},
				function(err) {
					if (err) {
						console.log(err);
						return res.redirect('/produits');
					}
					// deletes all reviews associated with the produit
					Review.remove(
						{
							_id: {
								$in: produit.reviews
							}
						},

						function(err) {
							if (err) {
								console.log(err);
								return res.redirect('/produits');
							}


              // PARTIE DE LA SUPPRESSION DES ANALYSES ASSOCIEES AVEC PRODUIT

              Campagne.find({imei: produit.imei },async function(err, foundCampagnes){

                if((typeof (foundCampagnes) !="undefined")) {

                  foundCampagnes.forEach(function(foundCampagne){

                     foundCampagne.remove();

                    });

                }

              });

							//  Supprimer le produit
							produit.remove();
							req.flash('success', 'Produit supprimé avec succès !');
							res.redirect('/produits');
						}
					);
				}
			);
		}
	});
});

// Produit Like Route
router.post('/:id/like', middleware.isLoggedIn, function(req, res) {

  Produit.findById(req.params.id, function(err, foundProduit) {
		if (err) {
			console.log(err);
			return res.redirect('/produits');
		}

		var foundUserLike = foundProduit.likes.some(function(like) {
			return like.equals(req.user._id);
		});
		if (foundUserLike) {

			foundProduit.likes.pull(req.user._id);
		} else {

			foundProduit.likes.push(req.user);
		}

		foundProduit.save(function(err) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('/produits');
			}
			return res.redirect('/produits/' + foundProduit._id);
		});
	});
});

module.exports = router;
