var Terminal = require("../models/terminal");
var Printer = require("../models/printer");


// Tous les middlewares sont ici
var middlewareObj = {};

middlewareObj.checkTerminalOwnership = function (req, res, next) {

    if (req.isAuthenticated()) {
        Terminal.findById(req.params.id, function (err, foundTerminal) {
            if (err || !foundTerminal) {
                req.flash("error", "Borne pas trouvée");
                res.redirect("back");
            } else {
                // L'utilisateur est le créateur de la borne ?
                if (foundTerminal.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Autorisation insuffisante !");
                    res.redirect("back");
                }
            }
        });

    } else {
        req.flash("error", "Vous devez être connecté d'abord !");
        res.redirect("back");
    }
};

middlewareObj.checkPrinterOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Printer.findById(req.params.printer_id, function (err, foundPrinter) {
            if (err || !foundPrinter) {
                req.flash("error", "Imprimante non trouvée");
                res.redirect("back");
            } else {
              // L'utilisateur est le créateur de l'imprimante ?
                if (foundPrinter.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Autorisation insuffisante");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Vous devez être connecté d'abord !");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function (req, res, next) {
    if ( req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("/login");
};


middlewareObj.checkAgent = function (req, res, next) {
  if (req.isAuthenticated()) {

        if (req.user.role == "agent") {
          return next();
        } else {
          req.flash("error", "Vous devez être agent !");
          res.redirect("back");
        }
      } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
};

middlewareObj.checkAdmin = function (req, res, next) {
  if (req.isAuthenticated()) {

    if (req.user.role =="admin") {
      return next();
    } else {
      req.flash("error", " Vous devez être administrateur !");
      res.redirect("back");
    }
  } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
};

middlewareObj.checkAdminAgent = function (req, res, next) {

  if (req.isAuthenticated()) {

    if (req.user.role =="admin"|| req.user.role =="agent") {
      return next();
    } else {
      req.flash("error", " Vous devez être administrateur ou agent  !");
      res.redirect("back");
    }
  } else {
    req.flash("error", "Vous devez être connecté d'abord !");
    res.redirect("back");
  }
  
};


module.exports = middlewareObj;
