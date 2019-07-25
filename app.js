// Process stuff
if(process.env.HEROKU != "yes"){
	require('dotenv').config();
}
// DEPENDENTS
var express 		= require("express"),
	app 			= express(),
	bodyParser		= require("body-parser"),
	mongoose		= require("mongoose"),
	http 			= require("http"),
	passport		= require("passport"),
	localStrategy	= require("passport-local"),
	expressSession	= require("express-session");
	Campground    	= require("./models/campground"),
	Comment 		= require("./models/comment"),
	User 			= require("./models/user"),
	seedDB			= require("./seeds");

seedDB();

// SETUP

// Mongoose
var username = process.env.USERNAME;
var password = process.env.WEBDEVBOOTCAMPPASS;
mongoose.connect('mongodb+srv://'+username+':'+password+'@data-sodyq.mongodb.net/yelpcamp?retryWrites=true&w=majority', { useNewUrlParser: true });
// File stuff
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"))
// Passport config
app.use(expressSession({
	secret: process.env.PASSPORTSECRET || "123",
	resave: false,
	saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));


// ROUTES
app.get("/", function(req, res){
	res.render("landing");
});
// INDEX view campgrounds
app.get("/campgrounds", function(req, res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log(err);
		} else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds});
		}
	});
});
// ADD add campground
app.get("/campgrounds/new", function(req, res){
	res.render("campgrounds/new");
});
// CREATE post to DB
app.post("/campgrounds", function(req, res){
	var newCampground = req.body;
	console.log(newCampground)
    Campground.create(newCampground, function(err, newCamp){
		if(err){
			console.log("error making campground");
			console.log(err);
			res.redirect("/campgrounds/new");
		} else {
	        res.redirect("/campgrounds");
		}
	});

});
// SHOW show campground
app.get("/campgrounds/:id", function(req, res) {
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log("Error getting Campground");
			console.log(err);
		} else {
			if(foundCampground){
			    res.render("campgrounds/show", { campground: foundCampground });
			} else {
				res.redirect("/campgrounds");
			}
		}
	});
});
// COMMENTS ROUTES
// ADD a comment
app.get("/campgrounds/:id/comments/new", function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		} else {
			res.render("comments/new", {campground: campground})
		}
	})
})
// CREATE a comment
app.post("/campgrounds/:id/comments/new", function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		var campgroundPath = "/campgrounds/"+req.params.id;
		if(err){
			console.log(err);
			res.redirect(campgroundPath);
		} else {
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					res.redirect(campgroundPath);
				} else {
					campground.comments.push(comment);
					campground.save();
					res.redirect(campgroundPath);
				}
			})
		}
	})
})

// ====================
// RUN APP
// ====================
var port = process.env.PORT || 9000;
app.listen(port, process.env.IP, function(){
	console.log(`Yelp Camp server has started on port ${port}!`);
});

// Keep heroku app awake
if(process.env.HEROKU == "yes"){
	setInterval(function(){
		http.get("http://paradox-yelp-camp.herokuapp.com")
	}, 280000);
}
