
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    Campground  = require("../models/campground");

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
router.get("/new", function(req, res){
	res.render("campgrounds/new");
});
// CREATE post to DB
router.post("/", function(req, res){
	var newCampground = req.body;
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
