const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const Terminal = require('../models/terminal');
const middleware = require('../middleware');

// Fonction de recherches des commandes
async function searchOrdersByQuery(client, query) {

  let foundOrders = [];

  // Tout
  if ((query.date_begin && query.date_end) && query.terminal_id && query.printer_id){

    foundOrders = client.orders.filter(order => {

      return (
        order.createdAt >= new Date(query.date_begin) &&
        order.createdAt < new Date(query.date_end) &&
        order.terminal == query.terminal_id &&
        order.printer == query.printer_id
      )
  
    })

  // Date et Terminal
  }else if ((query.date_begin && query.date_end) && query.terminal_id) {


    foundOrders = client.orders.filter(order => {

      return (
        order.createdAt >= new Date(query.date_begin) &&
        order.createdAt < new Date(query.date_end) &&
        order.terminal == query.terminal_id
      )
  
    })

  // Date et Imprimante
  }else if ((query.date_begin && query.date_end) && query.printer_id) { 


    foundOrders = client.orders.filter(order => {

      return (
        order.createdAt >= new Date(query.date_begin) &&
        order.createdAt < new Date(query.date_end) &&
        order.printer == query.printer_id
      )
  
    })


  // Borne et Imprimante
  }else if (query.terminal_id && query.printer_id) { 


    foundOrders = client.orders.filter(order => {

      return (
        order.terminal == query.terminal_id &&
        order.printer == query.printer_id
      )

    })


  // Date
  }else if (query.date_begin && query.date_end) { 
    
    
    foundOrders = client.orders.filter(order => {

      return (
        order.createdAt >= new Date(query.date_begin) &&
        order.createdAt < new Date(query.date_end)
      )
  
    })


  // Borne
  }else if (query.terminal_id) { 

    foundOrders = client.orders.filter(order => {

      return (
        order.terminal == query.terminal_id
      )

    })  

  // Imprimante
  }else if (query.printer_id) { 

    foundOrders = client.orders.filter(order => {

      return (
        order.printer == query.printer_id
      )

    })

  }  

  return foundOrders;

};


// Fonction de comptage des commandes réussies et échouées
async function searchCountOrdersByQuery(client, query) {

  foundOrdersFiltered = client.orders.filter(order => {

    return (
      order.createdAt >= new Date(query.date_begin_filtered) &&
      order.createdAt < new Date(query.date_end_filtered)  
    );

  });

  return foundOrdersFiltered;

};

// INDEX - All Clients
router.get('/', middleware.checkAdminAgent, async (req, res) => {

  try {

    const perPage = 8;
    const pageQuery = parseInt(req.query.page);
    const pageNumber = pageQuery ? pageQuery : 1;
    const searchQuery = req.query.search || '';

    const searchOptions = searchQuery ? { phone_number: searchQuery } : {};

    const [allClients, count] = await Promise.all([
      Client.find(searchOptions)
        .skip(perPage * pageNumber - perPage)
        .limit(perPage)
        .exec(),
      Client.countDocuments(searchOptions).exec(),
    ]);

    if (allClients.length < 1 && req.query.search) {

      req.flash(
        'error',
        'Aucun client correspond à votre recherche, réessayez svp.'
      );
      return res.redirect('back');

    }

    res.render('clients/index', {

      r_clients: allClients,
      current: pageNumber,
      pages: Math.ceil(count / perPage),
      search: searchQuery,

    });

  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
  
});


// CREATE - Ajouter un nouveau client à la base de données
router.post('/', async (req, res) => {

  try {
   
    console.log(req.body); 
    const client = await Client.create(req.body.client);
    res.redirect('/clients/' + client._id);

  } catch (err) {

    req.flash('error', err.message);
    res.redirect('back');

  }

});


// NEW - formulaire de création du client
router.get('/new', middleware.checkAdminAgent, (req, res) => {
  res.render('clients/new')
})

// SHOW - plus d'infos sur le client
router.get('/:id', middleware.checkAdminAgent, async (req, res) => {

  try {

    const foundClient = await Client.findById(req.params.id);
    const foundTerminals = await Terminal.find();

    if (!foundClient) {

      req.flash('error', 'Client non trouvé');
      return res.redirect('back');

    } else {
      
      let succeeded_prints = 0;
      let failed_prints = 0;

      // Pour le camembert  
      let succeeded_prints_filtered = 0;
      let failed_prints_filtered = 0;

      let foundOrders = [];
 
      // Pour le camembert
      let foundOrdersDonut = [];

      // Filtre des commandes
      if ((req.query.date_begin && req.query.date_end) || req.query.terminal_id || req.query.printer_id ) {

        foundOrders = await searchOrdersByQuery(foundClient, req.query);

        if (foundOrders.length === 0) {
          req.flash('error', 'Aucune commande trouvée');
          return res.redirect('back');
        }

      }
      
      // Filtre pour le camembert
      if ((req.query.date_begin_filtered && req.query.date_end_filtered)) {

        foundOrdersDonut = await searchCountOrdersByQuery(foundClient, req.query);

        console.log(foundOrdersDonut);

        if (foundOrdersDonut.length === 0) {

          req.flash('error', 'Aucune commande trouvée');
          return res.redirect('back');

        }else{

          foundOrdersDonut.forEach(order => {

            if (order.succeeded == true){

              succeeded_prints_filtered +=1;
            };

            if (order.succeeded == false){

              failed_prints_filtered +=1;
            };

          });  

        }

      };  

      foundClient.orders.forEach(order => {
        if (order.succeeded !== null && 'succeeded' in order) {
          if (order.succeeded === true) {
            succeeded_prints += 1;
          } else {
            failed_prints += 1;
          }
        }
      });

      res.render('clients/show', {
        r_client: foundClient,
        orders: foundOrders,
        terminals: foundTerminals,
        succeeded_prints,
        failed_prints,
        succeeded_prints_filtered,
        failed_prints_filtered

      });
    }
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }

});

// EDIT CLIENT ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, async (req, res) => {

  try {

    const foundClient = await Client.findById(req.params.id);

    res.render('clients/edit', {

      r_client: foundClient

    });

  } catch (err) {

    req.flash('error', err.message);
    res.redirect('back');

  }

});

// UPDATE CLIENT ROUTE
router.put('/:id', middleware.checkAdminAgent, async (req, res) => {

  try {

    const foundClient = await Client.findById(req.params.id);

    console.log(req.body);

    foundClient.phone_number = req.body.phone_number;

    await foundClient.save();

    req.flash('success', 'Mise à jour réussie !');
    res.redirect('/clients');

  } catch (err) {

    req.flash('error', err.message);
    res.redirect('back');

  }

});

// DESTROY CLIENT ROUTE
router.delete('/:id', middleware.checkAdminAgent, async (req, res) => {
  try {

    const foundClient = await Client.findById(req.params.id);
    await foundClient.remove();

    req.flash('success', 'Client supprimé avec succès !');
    res.redirect('/clients');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/clients');
  }
});

module.exports = router;
