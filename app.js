// DEPENDENTS
var express 		= require("express"),
	app 			= express(),
	bodyParser		= require("body-parser"),
	mongoose		= require("mongoose");


// SETUP

// Mongoose
mongoose.connect('mongodb://localhost:27017/yelp_camp', {
    useNewUrlParser: true
}).catch(function(e){
    console.log("Error occured connecting to mongodb");
	console.log(e);
});
// EJS
app.set("view engine", "ejs");
// Body parser
app.use(bodyParser.urlencoded({extended: true}));


// MONGO

//Schema
var campgroundSchema = new mongoose.Schema({
	name: String,
	img: String,
	description: String
});
var Campground = mongoose.model("Campground", campgroundSchema);




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
            res.render("campgrounds", {campgrounds: allCampgrounds});
		}
	});
});
// ADD add campground
app.get("/campgrounds/new", function(req, res){
	res.render("new");
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
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			console.log("Error getting Campground");
			console.log(err);
		} else {
		    res.render("show", {campground: foundCampground});
		}
	});
});

// RUN APP
app.listen(process.env.PORT || 9000, process.env.IP, function(){
	console.log("Yelp Camp server has started!");
});