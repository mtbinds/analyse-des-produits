const express = require('express');
const router = express.Router();
const Terminal = require('../models/terminal');
const Client = require('../models/client');
const middleware = require('../middleware');

// Multer/Cloudinary
const multer = require('multer');

const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dajeg1r6h',
  api_key: 152352994553188,
  api_secret: '-bVk1M89N4tQ_rS-nSepQ5amK4Y'
});

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const imageFilter = function(req, file, cb) {
  // accepter que les images
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Seules les images sont autorisées!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: imageFilter
});

async function uploadToCloudinary(locaFilePath) {
  try {
    const mainFolderName = "main";
    const filePathOnCloudinary = mainFolderName + "/" + locaFilePath;
    const result = await cloudinary.uploader.upload(locaFilePath, { public_id: filePathOnCloudinary });
    return {
      message: "Success",
      url: result.url,
      id: result.public_id,
    };
  } catch (error) {
    fs.unlinkSync(locaFilePath);
    return { message: "Fail" };
  }
}


// Fonction de recherche des commandes / filtration (Statistiques)
async function searchTerminalClientsOrdersStatsByQuery(clients, terminal_id, query) {

  let filteredOrders = [];


  // Date, imprimante et client
  if((query.date_begin_filtered && query.date_end_filtered) && query.printer_id && query.client_phone){

    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone

      );

    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.createdAt >= new Date(query.date_begin_filtered) &&
          order.createdAt < new Date(query.date_end_filtered) &&
          order.printer == query.printer_id &&
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });

  // Date et imprimante
  }else if((query.date_begin_filtered && query.date_end_filtered) && query.printer_id){

    
    clients.forEach(client => {

      clientOrders = client.orders.filter(order => {

        return (
            order.createdAt >= new Date(query.date_begin_filtered) &&
            order.createdAt < new Date(query.date_end_filtered) &&
            order.printer == query.printer_id &&
            order.terminal == terminal_id  
        );


      });

      clientOrders.forEach(order => {

        filteredOrders.push(order);
        
      });


    });
    
  // Date et client
  }else if((query.date_begin_filtered && query.date_end_filtered) && query.client_phone){

    
    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone

      );

    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.createdAt >= new Date(query.date_begin_filtered) &&
          order.createdAt < new Date(query.date_end_filtered) &&
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });
    
  // Imprimante et client
  }else if(query.printer_id && query.client_phone){

    
    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone

      );

    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.printer == query.printer_id,
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });
    
  // Client
  }else if(query.client_phone){

    
    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone

      );

    });

    
    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });
    

  }else if(query.printer_id){

    clients.forEach(client => {

      clientOrders = client.orders.filter(order => {

        return (
            order.printer == query.printer_id &&
            order.terminal == terminal_id  
        );

      });

      clientOrders.forEach(order => {

        filteredOrders.push(order);
        
      });

    });
  
  // Date
  }else if (query.date_begin_filtered && query.date_end_filtered) {


    clients.forEach(client => {
  
      clientOrders = client.orders.filter(order => {
  
        return (
            order.createdAt >= new Date(query.date_begin_filtered) &&
            order.createdAt < new Date(query.date_end_filtered) &&
            order.terminal == terminal_id  
        );
  
      });
  
      clientOrders.forEach(order => {
  
        filteredOrders.push(order);
        
      });
  
  
    });
  }  

  return filteredOrders;
  
};


// Fonction de recherche des commandes / filtration (Affichage)
async function searchTerminalClientsOrdersShowByQuery(clients, terminal_id, query) {

  let filteredOrders = [];

  // Date, imprimante et client
  if((query.date_begin_filtered_orders && query.date_end_filtered_orders) && query.printer_id_orders && query.client_phone_orders){

    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone_orders

      );
  
    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.createdAt >= new Date(query.date_begin_filtered_orders) &&
          order.createdAt < new Date(query.date_end_filtered_orders) &&
          order.printer == query.printer_id_orders &&
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });

  // Date et imprimante
  }else if((query.date_begin_filtered_orders && query.date_end_filtered_orders) && query.printer_id_orders){

    
    clients.forEach(client => {

      clientOrders = client.orders.filter(order => {

        return (
            order.createdAt >= new Date(query.date_begin_filtered_orders) &&
            order.createdAt < new Date(query.date_end_filtered_orders) &&
            order.printer == query.printer_id_orders &&
            order.terminal == terminal_id  
        );


      });

      clientOrders.forEach(order => {

        filteredOrders.push(order);
        
      });


    });
    
  // Date et client
  }else if((query.date_begin_filtered_orders && query.date_end_filtered_orders) && query.client_phone_orders){

    
    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone_orders

      );

    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.createdAt >= new Date(query.date_begin_filtered_orders) &&
          order.createdAt < new Date(query.date_end_filtered_orders) &&
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });
    
  // Imprimante et lient
  }else if(query.printer_id_orders && query.client_phone_orders){

    
    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone_orders

      );

    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.printer == query.printer_id_orders,
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });
    
  // Client
  }else if(query.client_phone_orders){
    
  
    filteredClient = clients.find(client => {

      return (

        client.phone_number == query.client_phone_orders

      );

    });


    clientOrders = filteredClient.orders.filter(order => {

      return (
          order.terminal == terminal_id  
      );

    });

    clientOrders.forEach(order => {

      filteredOrders.push(order);
      
    });
  

  }else if(query.printer_id_orders){

    clients.forEach(client => {

      clientOrders = client.orders.filter(order => {

        return (
            order.printer == query.printer_id_orders &&
            order.terminal == terminal_id  
        );

      });

      clientOrders.forEach(order => {

        filteredOrders.push(order);
        
      });

    });
  
  // Date
  }else if (query.date_begin_filtered_orders && query.date_end_filtered_orders) {


    clients.forEach(client => {
  
      clientOrders = client.orders.filter(order => {
  
        return (
            order.createdAt >= new Date(query.date_begin_filtered_orders) &&
            order.createdAt < new Date(query.date_end_filtered_orders) &&
            order.terminal == terminal_id  
        );
  
      });
  
      clientOrders.forEach(order => {
  
        filteredOrders.push(order);
        
      });
  
  
    });
  }  

  return filteredOrders;
  
};


// Fonction de recherche des clients / filtration (Affichage)
async function searchTerminalClientsShowByQuery(clients, query) {

  let filteredClients = [];

  // Date, imprimante et client
  if((query.date_begin_filtered_clients && query.date_end_filtered_clients) && query.client_phone_clients){

    filteredClients = clients.filter(client => {

      return (

        client.phone_number == query.client_phone_clients

      );

    });

  }else if (query.date_begin_filtered_clients && query.date_end_filtered_clients) {
    
    filteredClients = clients.filter(client => {

      return (

          client.createdAt >= new Date(query.date_begin_filtered_clients) &&
          client.createdAt < new Date(query.date_end_filtered_clients)
          
      );

    });


  }else if (query.client_phone_clients) {


    filteredClients = clients.filter(client => {

      
      return (

        client.phone_number == query.client_phone_clients

      );

    });


  };

  return filteredClients;

};  

//INDEX - All Terminals
router.get('/', async (req, res) => {

  try {

    const perPage = 8;
    const pageQuery = parseInt(req.query.page);
    const pageNumber = pageQuery ? pageQuery : 1;
    const searchQuery = req.query.search || '';
    const searchOptions = searchQuery ? { _id: req.query.search } : {};

    const allNonSearchTerminals = Terminal.find();

    console.log(allNonSearchTerminals);

    const [allTerminals, count] = await Promise.all([
      Terminal.find(searchOptions)
        .skip(perPage * pageNumber - perPage)
        .limit(perPage)
        .exec(),
      Terminal.countDocuments(searchOptions).exec()
    ]);

    if (allTerminals.length < 1 && req.query.search) {
      req.flash('error', 'Aucune borne correspond à votre recherche, réessayez svp.');
      return res.redirect('back');
    }

    res.render('terminals/index', {
      terminals: allTerminals,
      all_terminals : allNonSearchTerminals,
      current: pageNumber,
      pages: Math.ceil(count / perPage),
      search: searchQuery
    });

  } catch (err) {

    req.flash('error', err.message);
    res.redirect('back');

  }
});

// CREATE - Ajouter un nouveau terminal à la base de données
router.post('/', middleware.checkAdminAgent, upload.array("image", 3), async (req, res) => {

  try {

    const imageUrlList = [];
    const imageIdList = [];
    
    if (req.files) {
      for (const file of req.files) {
        const locaFilePath = file.path;
        const result = await uploadToCloudinary(locaFilePath);
        imageUrlList.push(result.url);
        imageIdList.push(result.id);
      }
    }

    req.body.terminal.image = imageUrlList;
    req.body.terminal.imageId = imageIdList;

    req.body.terminal.author = {
      id: req.user._id,
      username: req.user.username,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      email: req.user.email,
      phone_number: req.user.phone_number,
      role: req.user.role,
    };
    
    const terminal = await Terminal.create(req.body.terminal);
    res.redirect('/terminals/' + terminal._id);

  } catch (err) {

    req.flash('error', err.message);
    res.redirect('back');
    
  }
});

// NEW - formulaire de création du terminal
router.get('/new', middleware.checkAdminAgent, (req, res) => {
  res.render('terminals/new');
});

// SHOW - plus d'infos sur le terminal
router.get('/:id', async (req, res) => {

  try {

    const foundTerminal = await Terminal.findById(req.params.id);
    const foundClients = await Client.find();

    if (!foundTerminal || !foundClients) {

      if(!foundTerminal){

        req.flash('error', 'Borne non trouvée');
        return res.redirect('back');

      };

      if(!foundClients){

        req.flash('error', 'Aucun client trouvé');
        return res.redirect('back');

      }
    
    }else{

      // Toutes les commandes
      let allOrders = []; 

      // Tous les clients du terminal
      let terminalClients = [];

      // Clients filtrés du terminal
      let terminalFilteredClients = [];
      
      // Toutes les commandes de tous les clients (Statistiques)
      let terminalClientsOrders = [];

      // Toutes les commandes de tous les clients (Affichage)
      let terminalFilteredClientsOrders = [];

      let succeeded_prints = 0;
      let failed_prints = 0;
      
      let succeeded_prints_filtered = 0;
      let failed_prints_filtered = 0;


      // Calcul de toutes les impressions réussies et les impressions échouées d'un terminal
      foundClients.forEach(client => {

        clientOrders = client.orders.filter(order => {
    
            return (
              order.terminal == req.params.id  
            );
    
        });
    
        clientOrders.forEach(order => {
    
          allOrders.push(order);
          
        });
    
      });


      allOrders.forEach(order => {


        if(order.succeeded == true){
          succeeded_prints += 1;
        }

        if(order.succeeded == false){

          failed_prints += 1;
        }

      });

      //


      // Calcul d'impressions réussies et impressions échouées en fonction de date de début et date de fin (Statistiques)

      if ((req.query.date_begin_filtered && req.query.date_end_filtered) || req.query.printer_id || req.query.client_phone) {
        
        

        terminalClientsOrders = await searchTerminalClientsOrdersStatsByQuery(foundClients, req.params.id, req.query);

        // Calcul de nombre d'impressions réussies et échouées


        terminalClientsOrders.forEach(order => {

          if(order.succeeded == true){

            succeeded_prints_filtered += 1;

          };

          if(order.succeeded == false){

            failed_prints_filtered += 1;

          };


        });


        if (terminalClientsOrders.length === 0) {
          req.flash('error', 'Aucune commande trouvée');
          return res.redirect('back');
        }

      };

      
      // Filtrer les commandes passées sur la borne

      if ((req.query.date_begin_filtered_orders && req.query.date_end_filtered_orders) || req.query.printer_id_orders || req.query.client_phone_orders) {
        
        terminalFilteredClientsOrders = await searchTerminalClientsOrdersShowByQuery(foundClients, req.params.id, req.query);

        if (terminalFilteredClientsOrders.length === 0) {
          req.flash('error', 'Aucune commande trouvée');
          return res.redirect('back');
        }

      }

      //

      // Clients qui ont passé leurs commandes sur le terminal

      foundClients.forEach(client => {

        let check = false;

        client.orders.forEach(order => {

          if (order.terminal == req.params.id){

             check = true;
          }

        });
        
        if(check == true){
          terminalClients.push(client);
        }

      });

      //

      // Filtrer les clients de la commande

      if ((req.query.date_begin_filtered_clients && req.query.date_end_filtered_clients) || req.query.client_phone_clients ) {
        
        terminalFilteredClients = await searchTerminalClientsShowByQuery(foundClients, req.query);

        if (terminalFilteredClients.length === 0) {

          req.flash('error', 'Aucun client trouvé');
          return res.redirect('back');
        }

        

      }

      res.render('terminals/show', {

        terminal: foundTerminal,
        
        terminal_all_orders : allOrders,
        terminal_filtered_orders : terminalFilteredClientsOrders,

        terminal_all_clients : terminalClients,
        terminal_filtered_clients : terminalFilteredClients,


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

// EDIT TERMINAL ROUTE
router.get('/:id/edit', middleware.checkAdminAgent, async(req, res) => {

  try {

    const foundTerminal = await Terminal.findById(req.params.id);
    res.render('terminals/edit', {
      terminal: foundTerminal
    });

  } catch (err) {

    req.flash('error', err.message);
    res.redirect('back');

  }

});

// UPDATE TERMINAL ROUTE
router.put('/:id', middleware.checkAdminAgent, upload.array('image', 3), async (req, res) => {

  try {

    console.log(req.body);

    const imageUrlList = [];
    const imageIdList = [];
    const foundTerminal = await Terminal.findById(req.params.id);

    if (req.files){
      for (const file of req.files) {
        const locaFilePath = file.path;
        const result = await uploadToCloudinary(locaFilePath);
        imageUrlList.push(result.url);
        imageIdList.push(result.id);
      }
    };

    
    // La borne

    foundTerminal.address = req.body.address;
    foundTerminal.print_price = req.body.print_price;
    foundTerminal.description = req.body.description;
    foundTerminal.status = foundTerminal.status;
    foundTerminal.imageId = imageIdList;
    foundTerminal.image = imageUrlList;
    
    // Administrateur
    foundTerminal.admin_email = req.body.admin_email;
    foundTerminal.admin_reception_error_email = req.body.admin_reception_error_email;
    foundTerminal.admin_print_error_email = req.body.admin_print_error_email;

    foundTerminal.admin_phone_number = req.body.admin_phone_number;
    foundTerminal.admin_reception_error_sms = req.body.admin_reception_error_sms;
    foundTerminal.admin_print_error_sms = req.body.admin_print_error_sms;

    // Client
    foundTerminal.client_print_success_sms = req.body.client_print_success_sms;
    foundTerminal.client_print_error_sms = req.body.client_print_error_sms;
    
    // SMTP
    foundTerminal.smtp_host = req.body.smtp_host;
    foundTerminal.smtp_port = req.body.smtp_port;
    foundTerminal.smtp_password = req.body.smtp_password;

    await foundTerminal.save();

    req.flash('success', 'Mise à jour réussie !');
    res.redirect('/terminals');

  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }

});

// DESTROY TERMINAL ROUTE
router.delete('/:id', middleware.checkAdminAgent, async (req, res) => {
  try {

    const foundTerminal = await Terminal.findById(req.params.id).exec();

    if (!foundTerminal) {
      req.flash('error', 'Borne non trouvée');
      return res.redirect('back');
    }

    await foundTerminal.remove();

    req.flash('success', 'Borne supprimée avec succès !');
    res.redirect('/terminals');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

module.exports = router;
