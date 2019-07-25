
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    Comment     = require("../models/comment"),
    Campground  = require("../models/campground");

// Logged in only
function loggedInOnly(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}
// COMMENTS ROUTES
// ADD a comment
router.get("/new", loggedInOnly, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log("Error finding campground", err);
            return res.redirect("/campgrounds/" + req.params.id);
        }
        if(campground){
			return res.render("comments/new", { campground: campground })
        }
        res.redirect("/campgrounds/" + req.params.id);
	})
})
// CREATE a comment
router.post("/", loggedInOnly, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		var campgroundPath = "/campgrounds/"+req.params.id;
		if(err){
			console.log("Error finding campground", err);
			res.redirect(campgroundPath);
		} else if(campground){
			Comment.create(req.body.comment, function(err, comment){
				if(err){
                    console.log("Error making comment", err);
					res.redirect(campgroundPath);
				} else {
                    if(comment){
                        comment.author.username = req.user.username;
                        comment.author._id = req.user._id
                        comment.save();
    					campground.comments.push(comment);
    					campground.save();
                    }
					res.redirect(campgroundPath);
				}
			})
		} else {
            res.redirect(campgroundpath);
        }
	})
})

module.exports = router;
