var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    User        = require("../models/user"),
    Comment     = require("../models/comment"),
    Campground  = require("../models/campground"),
    middleware  = require("../middleware");

// COMMENTS ROUTES
// ADD a comment
router.get("/new", middleware.loggedInOnly, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
            req.flash("error", "Error finding campground")
            return res.redirect("/campgrounds/" + req.params.id);
        }
        if(campground){
			return res.render("comments/new", { campground: campground });
        }
        req.flash("error", "Campground not found");
        res.redirect("/campgrounds/" + req.params.id);
	});
});
// CREATE a comment
router.post("/", middleware.loggedInOnly, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		var campgroundPath = "/campgrounds/"+req.params.id;
		if(err){
            req.flash("error", "Error finding campground");
			res.redirect(campgroundPath);
		} else if(campground){
			Comment.create(req.body.comment, function(err, comment){
				if(err){
                    req.flash("error", "Error creating comment");
					res.redirect(campgroundPath);
				} else {
                    if(comment){
                        comment.author.username = req.user.username;
                        comment.author.id = req.user._id;
                        comment.campground.name = campground.name;
                        comment.campground.id = campground._id;
                        comment.save();
    					campground.comments.push(comment);
    					campground.save();
                        User.findById(req.user._id, function(err, user){
                            if(err){
                                res.flash("error", "User not found. Shouldn't happen");
                                res.redirect("back");
                            } else {
                                user.comments.push(comment._id);
                                user.save();
                            }
                        });
                    }
					res.redirect(campgroundPath);
				}
			});
		} else {
            req.flash("error", "Campground not found");
            res.redirect(campgroundpath);
        }
	});
});
// EDIT a comment
router.get("/:commentid/edit", middleware.ownsCommentOnly, function(req, res){
    Comment.findById(req.params.commentid, function(err, foundComment){
        if(err){
            req.flash("error", "Error finding comment");
            res.redirect("back");
        } else {
            res.render("comments/edit", { campgroundId: req.params.id, comment: foundComment });
        }
    });
});
// UPDATE a comment
router.put("/:commentid", middleware.ownsCommentOnly, function(req, res){
    Comment.updateOne({ _id: req.params.commentid }, { $set: req.body.comment }, function(err, comment){
        if(err){
            req.flash("error", "Error updating comment")
            res.redirect("back");
        } else if(comment) {
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            req.flash("error", "No comment found to update");
            res.redirect("back");
        }
    });
});
// DELETE a comment
router.delete("/:commentid", middleware.ownsCommentOnly, function(req, res){
    Comment.findById(req.params.commentid, function(err, foundComment){
        if(err){
            req.flash("error", "No comment found to delete");
            res.redirect("back");
        } else {
            Comment.deleteOne({ _id: req.params.commentid }, function(err){
                if(err){
                    req.flash("error", "Error deleting comment!");
                    res.redirect("back");
                } else {
                    User.findById(foundComment.author.id, function(err, foundUser){
                        if(err || !foundUser){
                            req.flash("error", "No User associated with comment");
                        } else {
                            var commentIndex = foundUser.comments.findIndex(function(c){
                                return c.equals(foundComment._id);
                            })
                            foundUser.comments.splice(commentIndex, 1);
                            foundUser.save();
                        }
                        res.redirect("/campgrounds/" + req.params.id);
                    })
                }
            });
        }
    });
});

module.exports = router;
