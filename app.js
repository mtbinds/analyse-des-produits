const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
var app = express();
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");
var methodOverride = require("method-override");
var flash = require("connect-flash");

const port = process.env.PORT || 3000;

// Requiring ROUTES
var commentRoutes = require("./routes/comments");
var messageRoutes = require("./routes/messages");
var replyRoutes = require("./routes/replies");
var reviewRoutes = require("./routes/reviews");
var produitRoutes = require("./routes/produits");
var typeRoutes = require("./routes/types");
var modeleRoutes = require("./routes/modeles");
var symptomeRoutes = require("./routes/symptomes");
var problemeRoutes = require("./routes/problemes");
var campagneRoutes = require("./routes/campagnes");
var plantRoutes = require("./routes/plants");
var testRoutes = require("./routes/tests");
var userRoutes = require("./routes/users");
var indexRoutes = require("./routes/index");

mongoose.connect("mongodb://127.0.0.1:27017/essai", {
     useNewUrlParser: true });

app.set('views', __dirname + '/views');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.json())
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash()); // flash updates
// seedDB(); // seed the database
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

app.use("/", indexRoutes);

app.use("/users", userRoutes);

app.use("/produits", produitRoutes);
app.use("/types", typeRoutes);
app.use("/modeles", modeleRoutes);
app.use("/symptomes", symptomeRoutes);
app.use("/problemes", problemeRoutes);
app.use("/campagnes", campagneRoutes);
app.use("/plants", plantRoutes);
app.use("/tests", testRoutes);

app.use("/produits/:id/type", typeRoutes);
app.use("/produits/:id/modele", modeleRoutes);
app.use("/produits/:id/comments", commentRoutes);
app.use("/produits/:id/messages", messageRoutes);
app.use("/produits/:id/messages/:id/replies", replyRoutes);
app.use("/produits/:id/reviews", reviewRoutes);

app.use("/campagnes/:id/produit", produitRoutes);
app.use("/campagnes/:id/symptomes", campagneRoutes);
app.use("/campagnes/:id/messages", messageRoutes);
app.use("/campagnes/:id/messages/:id/replies", replyRoutes);

app.use("/types/:id/messages", messageRoutes);
app.use("/types/:id/messages/:id/replies", replyRoutes);

app.use("/modeles/:id/messages", messageRoutes);
app.use("/modeles/:id/messages/:id/replies", replyRoutes);

app.use("/symptomes/:id/messages", messageRoutes);
app.use("/symptomes/:id/messages/:id/replies", replyRoutes);
app.use("/symptomes/:id/problemes", problemeRoutes);

app.use("/problemes/:id/messages", messageRoutes);
app.use("/problemes/:id/messages/:id/replies", replyRoutes);
app.use("/problemes/:id/plants", plantRoutes);

app.use("/plants/:id/messages", messageRoutes);
app.use("/plants/:id/messages/:id/replies", replyRoutes);
app.use("/plants/:id/tests", testRoutes);

app.use("/tests/:id/messages", messageRoutes);
app.use("/tests/:id/messages/:id/replies", replyRoutes);

app.use("/uploads", express.static("uploads"));

// Express listens for requests (Start server)
app.listen(port, () => console.log(`Site de réparation des produits starting on port ${port}!`))


