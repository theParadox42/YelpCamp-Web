
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    Comment     = require("../models/comment"),
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
function ownsCommentOnly(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.commentid, function(err, foundComment){
            if(err){
                res.redirect("back");
            } else if(foundComment.author.id.equals(req.user._id) || req.user.admin){
                next();
            } else {
                res.redirect("back");
            }
        });
    } else {
        res.redirect("back")
    }
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
// EDIT a comment
router.get("/:commentid/edit", ownsCommentOnly, function(req, res){
    Comment.findById(req.params.commentid, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit", {campgroundId: req.params.id, comment: foundComment})
        }
    })
})
// UPDATE a comment
router.put("/:commentid", ownsCommentOnly, function(req, res){
    Comment.updateOne({ _id: req.params.commentid }, { $set: req.body.comment }, function(err, comment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
// DELETE a comment
router.delete("/:commentid", ownsCommentOnly, function(req, res){
    Comment.deleteOne({ _id: req.params.commentid }, function(err){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
})

module.exports = router;
