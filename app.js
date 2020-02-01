
// DEPENDENTS
var _				= require("dotenv").config(),
	express 		= require("express"),
	app 			= express(),
	bodyParser		= require("body-parser"),
	mongoose		= require("mongoose"),
	flash			= require("connect-flash"),
	methodOverride	= require("method-override"),
	passport		= require("passport"),
	localStrategy	= require("passport-local"),
	basicStrategy   = require("passport-http").BasicStrategy,
	expressSession	= require("express-session"),
	User 			= require("./models/user"),
	indexRoutes		= require("./routes/index.js"),
	userRoutes		= require("./routes/user.js"),
	campingRoutes	= require("./routes/campgrounds.js"),
	commentRoutes	= require("./routes/comments.js"),
	apiRoutesV1		= require("./routes/api-v1.js");

// SETUP

// Mongoose
mongoose.connect(require("./helpers/connection"), { useNewUrlParser: true, useUnifiedTopology: true });
// Moment Package
app.locals.moment = require('moment');
// File stuff
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"))
app.use(methodOverride("_method"));
// User Auth & passport config
app.use(expressSession({
	secret: process.env.PASSPORT_SECRET || "123",
	resave: false,
	saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.use(new basicStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// Flash setup and locals
app.use(flash());
app.use(function(req, res, next){
	res.locals.user = req.user;
	res.locals.errorFlashMessage = req.flash("error");
	res.locals.successFlashMessage = req.flash("success");
	next();
})

// Routes
app.use(userRoutes);
app.use("/campgrounds", campingRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/api/v1", apiRoutesV1);
app.use(indexRoutes);


// ====================
// RUN APP
// ====================
var port = process.env.PORT || 9000;
app.listen(port, process.env.IP, function(){
	console.log(`Yelp Camp server has started on port ${port}!`);
});

// This was using too many dyno hours.
/*
// Keep heroku app awake
if(process.env.HEROKU == "yes"){
	setInterval(function(){
		http.get("http://paradox-yelp-camp.herokuapp.com")
	}, 280000);
}
*/
