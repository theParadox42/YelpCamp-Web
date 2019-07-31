
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    http        = require("http"),
    Campground  = require("../models/campground"),
    User        = require("../models/user"),
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
    User.findById(req.user._id, function(userErr, foundUser){
        Campground.create(newCampground, function(campgroundErr, newCamp){
    		if(campgroundErr){
                req.flash("error", "Error making campground")
    			res.redirect("/campgrounds/new");
    		} else {
                req.flash("success", "Campground: " + newCamp.name + " created!")
                if(!userErr && foundUser){
                    foundUser.campgrounds.push(newCamp._id);
                    foundUser.save();
                    console.log(foundUser);
                } else {
                    req.flash("error", "Error with user");
                }
    	        res.redirect("/campgrounds");
    		}
    	});
    })
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
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Error finding campground to delete");
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            Campground.deleteOne({ _id: foundCampground._id }, function(err){
                if(err){
                    req.flash("error", "Error deleting campground");
                    res.redirect("/campgrounds/" + req.params.id);
                } else {
                    User.findById(foundCampground.author.id, function(err, foundUser){
                        if(!err && foundUser){
                            var campgroundIndex = foundUser.campgrounds.findIndex(function(c){
                                return c.equals(foundCampground._id);
                            })
                            foundUser.campgrounds.splice(campgroundIndex, 1);
                            foundUser.save();
                        } else {
                            req.flash("error", "No user associated with campground");
                        }
                        for(var i = 0; i < foundCampground.comments.length; i ++){
                            http.request(req.protocol + "://" + req.get("host") + "/campgrounds/" + foundCampground._id + "/comments/" + foundCampground.comments[i]);
                        }
                        res.redirect("/campgrounds");
                    });
                }
            });
        }
    });
});



module.exports = router;
