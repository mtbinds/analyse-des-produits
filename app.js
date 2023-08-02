const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const app = express();
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const port = process.env.PORT || 3000;

// Requiring ROUTES

const terminalRoutes = require("./routes/terminals");
const clientRoutes = require("./routes/clients");
const printerRoutes = require("./routes/printers");
const userRoutes = require("./routes/users");
const indexRoutes = require("./routes/index");

mongoose.connect("mongodb+srv://madjid:Taoualit2016@cluster0.vydqb.mongodb.net/kenwyz_connect?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true 
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.set('views', __dirname + '/views');
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

// PASSPORT CONFIG
app.use(require("express-session")({
    secret: "Madjid's Secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// passport-local-mongoose config
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// currentUser
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// ROUTES

app.use("/", indexRoutes);
app.use("/users", userRoutes);
app.use("/terminals", terminalRoutes);
app.use("/terminals/:id/printers", printerRoutes);
app.use("/clients", clientRoutes);
app.use("/uploads", express.static("uploads"));

// Error handlers
app.use((req, res, next) => {
  res.status(404).send('Page non trouvée.');
});

// Express listens for requests (Start server)
app.listen(port, () => console.log(`Site de gestion des bornes starting on port ${port}!`));
