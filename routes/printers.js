var express = require("express");
var router = express.Router({
    mergeParams: true
});

var Terminal = require("../models/terminal");
var Printer = require("../models/printer");
var Client = require("../models/client");
var middleware = require("../middleware");
const { forEach } = require("async");


// PRINTER ROUTES
// =====================

// Ajout d'une imprimante

router.get("/new", middleware.checkAdminAgent, (req, res) => {

    // Chercher terminal par id
    Terminal.findById(req.params.id, (err, terminal) => {

        if (err) {

            req.flash("error", err.message);
            console.log(err);

        } else {

            res.render("printers/new", {

                terminal: terminal
            
            });
        }
    })
})

// Ajout d'une imprimante

router.post("/", middleware.checkAdminAgent, (req, res) => {

    Terminal.findById(req.params.id, (err, terminal) => {

        if (err) {

            req.flash("error", "Imprimante non trouvée");
            res.redirect("/terminals");

        } else {

            // création d'un printeraire
            Printer.create(req.body.printer, (err, printer) => {

                if (err) {

                    console.log(err);
                    req.flash("error", err.message);

                } else {
                    
                    printer.author.id = req.user._id;
                    printer.author.username = req.user.username;
                    printer.author.firstname = req.user.firstname;
                    printer.author.lastname = req.user.lastname;
                    printer.author.email = req.user.email;
                    printer.author.phone_number = req.user.phone_number;
                    printer.author.role = req.user.role;
                    
                    printer.save();
                    terminal.printers.push(printer);
                    terminal.save();
                    req.flash("success", "Imprimante ajoutée avec succès");
                    res.redirect("/terminals/" + terminal._id);
                    
                }
            })
        }
    })
})

// PRINTER EDIT ROUTE
router.get("/:printer_id/edit", middleware.checkAdminAgent, (req, res) => {
    Terminal.findById(req.params.id, (err, foundTerminal) => {
        if (err || !foundTerminal) {
            req.flash("error", "Pas de bornes trouvées");
            return res.redirect("back");
        }
        Printer.findById(req.params.printer_id, (err, foundPrinter) => {
            if (err) {
                res.redirect("back");
            } else {
                res.render("printers/edit", {
                    terminal_id: req.params.id,
                    printer: foundPrinter
                });
            }
        });
    });
});

// PRINTER UPDATE ROUTE
router.put("/:printer_id", middleware.checkAdminAgent, (req, res) => {

    Printer.findByIdAndUpdate(req.params.printer_id, req.body.printer, (err, updatedPrinter) => {
        if (err) {
            res.redirect("back");
            req.flash("error", err.message);
        } else {

            // Update a printer in the printers array
            Terminal.updateOne(
                
                { _id: req.params.id, 'printers._id': req.params.printer_id }, // Match the document by its _id field and the printer by its _id within the printers array
                { $set: { 'printers.$.name': req.body.printer.name } }, // Update the 'status' field of the matching printer
                
                (err) => {
                    if (err) {
                       console.log('Failed to update printer:', err);
                    } else {
                       console.log('Printer updated successfully');
                    }
                }
            );

            res.redirect("/terminals/" + req.params.id);
        }
    })

});

// DESTROY PRINTER ROUTE

router.delete("/:printer_id", middleware.checkAdminAgent, async (req, res) => {
    
    try {

      
      // Supprimer l'imprimante du terminal
      await Terminal.updateOne(
        { _id: req.params.id },
        { $pull: { printers: { _id: req.params.printer_id } } }
      );

      // Supprimer les commandes de l'imprimante du client
      await Client.update(
        { $pull: { orders: { printer: req.params.printer_id } } }
      );

      // Supprimer l'imprimante de la collection des imprimantes
      await Printer.findByIdAndRemove(req.params.printer_id);
  
      req.flash("success", "Imprimante supprimée");
      res.redirect("/terminals/" + req.params.id);

    } catch (err) {

      req.flash("error", "Erreur lors de la suppression de l'imprimante");
      res.redirect("back");

    }

  });



module.exports = router;
