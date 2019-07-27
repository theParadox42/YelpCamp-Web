
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    Campground  = require("../models/campground"),
    middleware  = require("../middleware");


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
router.get("/new", middleware.loggedInOnly, function(req, res) {
	res.render("campgrounds/new");
});
// CREATE post to DB
router.post("/", middleware.loggedInOnly, function(req, res) {
	var newCampground = req.body.campground;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    newCampground.author = author;
    Campground.create(newCampground, function(err, newCamp){
		if(err){
            req.flash("error", "Erro making campground")
			res.redirect("/campgrounds/new");
		} else {
            req.flash("success", "Campground: " + newCamp.name + " created!")
	        res.redirect("/campgrounds");
		}
	});

});
// SHOW campground
router.get("/:id", function(req, res) {
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
            req.flash("error", "Error finding campground")
            res.redirect("/campgrounds");
		} else {
			if(foundCampground){
			    res.render("campgrounds/show", { campground: foundCampground });
			} else {
                req.flash("error", "Campground not found")
				res.redirect("/campgrounds");
			}
		}
	});
});
// EDIT campground
router.get("/:id/edit", middleware.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            req.flash("Error finding campground");
            res.redirect("/campgrounds/"+req.params.id);
        } else {
            res.render("campgrounds/edit", { campground: foundCampground });
        }
    });
});
// UPDATE campground
router.put("/:id", middleware.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            Campground.updateOne({ _id: foundCampground._id }, { $set: req.body.campground }, function(err, updatedCampground){
                if(err || !updatedCampground){
                    req.flash("error", "Error updating campground");
                    res.redirect("/campgrounds/" + req.params.id);
                } else {
                    res.redirect("/campgrounds/" + req.params.id);
                }
            });
        }
    });
});
// DELETE campground
router.delete("/:id", middleware.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Error finding campground to delete");
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            Campground.deleteOne({ _id: req.params.id }, function(err){
                if(err){
                    req.flash("error", "Error deleting campground");
                    res.redirect("/campgrounds/" + req.params.id);
                } else {
                    res.redirect("/campgrounds");
                }
            });
        }
    });
});



module.exports = router;
