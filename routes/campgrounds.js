
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    Campground  = require("../models/campground");

// MIDDLEWARE
// Logged in only
function loggedInOnly(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}
// Authorized only
function ownsCampgroundOnly(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                res.redirect("back");
            } else if(foundCampground.author.id.equals(req.user._id) || req.user.admin){
                next();
            } else {
                res.redirect("back");
            }
        });
    } else {
        res.redirect("back");
    }
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
router.get("/new", loggedInOnly, function(req, res) {
	res.render("campgrounds/new");
});
// CREATE post to DB
router.post("/", loggedInOnly, function(req, res) {
	var newCampground = req.body.campground;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
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
// SHOW campground
router.get("/:id", function(req, res) {
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log("Error getting Campground");
			console.log(err);
            res.redirect("/campgrounds");
		} else {
			if(foundCampground){
			    res.render("campgrounds/show", { campground: foundCampground });
			} else {
				res.redirect("/campgrounds");
			}
		}
	});
});
// EDIT campground
router.get("/:id/edit", ownsCampgroundOnly, function(req, res){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                res.redirect("/campgrounds/"+req.params.id);
            } else {
                res.render("campgrounds/edit", { campground: foundCampground });
            }
        });
    } else {
        res.redirect("/campgrounds/"+req.params.id);
    }
});
// UPDATE campground
router.put("/:id", ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            Campground.updateOne({ _id: foundCampground._id }, { $set: req.body.campground }, function(err, updatedCampground){
                if(err || !updatedCampground){
                    res.redirect("/campgrounds/" + req.params.id);
                } else {
                    res.redirect("/campgrounds/" + req.params.id);
                }
            });
        }
    });
    // Campground.findOneAndUpdate({ _id: req.params.id }, { $set: req.body.campground }, function(err, updatedCampground){
    //     if(err){
    //         res.redirect("/campgrounds");
    //     } else {
    //         res.redirect("/campgrounds/" + updatedCampground._id)
    //     }
    // })
});
// DELETE campground
router.delete("/:id", ownsCampgroundOnly, function(req, res){

    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            Campground.deleteOne({ _id: req.params.id }, function(err){
                if(err){
                    res.redirect("/campgrounds/" + req.params.id);
                } else {
                    res.redirect("/campgrounds");
                }
            });
        }
    });
});



module.exports = router;
