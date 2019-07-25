
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    Campground  = require("../models/campground");

// Logged in only
function loggedInOnly(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}
// CAMPGROUND ROUTES
// INDEX view campgrounds
router.get("/", function(req, res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log(err);
		} else {
            res.render("campgrounds/index", { campgrounds: allCampgrounds });
		}
	});
});
// ADD add campground
router.get("/new", loggedInOnly, function(req, res){
	res.render("campgrounds/new");
});
// CREATE post to DB
router.post("/", loggedInOnly, function(req, res){
	var newCampground = req.body.campground;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    newCampground.author = author;
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
router.get("/:id", function(req, res) {
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log("Error getting Campground");
			console.log(err);
            res.redirect("/campgrounds")
		} else {
			if(foundCampground){
			    res.render("campgrounds/show", { campground: foundCampground });
			} else {
				res.redirect("/campgrounds");
			}
		}
	});
});

module.exports = router;
