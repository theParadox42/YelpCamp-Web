
/*

    YelpCamp API v1.0

*/

// Dependents
var router      = require("express").Router({ mergeParams: true }),
    passport    = require("passport"),
    Campground  = require("../models/campground"),
    User        = require("../models/user"),
    Comment     = require("../models/comment"),
    middleware  = require("../middleware"),
    sendJSON    = require("../helpers/sendJSON"),
    sinceCreated= require("../helpers/addSinceCreated"),
    deleteUser  = require("../helpers/deleteUser");

//My first version of a YelpCamp API
router.get("/", function(req, res){
    sendJSON(res, { message: "YelpCamp API here!" }, "message")
});
// Documentation Visit "/api/v1/docs" to view
router.get("/docs", function(req, res){
    res.render("api-docs");
})

// USER
router.post("/register", function(req, res){
    if(req.body.admincode == process.env.ADMIN_CODE) {
        if(req.body.password) {
            var userPassword;
            if(typeof req.body.password == "string"){
                userPassword = req.body.password
            } else if(typeof req.body.password.first == "string"){
                userPassword = req.body.password.first
            } else {
                return sendJSON(res, { message: "Wrong password format" }, "error")
            }
            var newUser = new User({ username: req.body.username, email: req.body.email });
            User.register(newUser, userPassword, function(err, returnedUser){
                if(err){
                    return sendJSON(res, { message: "Error creating user", error: err }, "error");
                }
                passport.authenticate("local")(req, res, function(){
                    sendJSON(res, { message: "Successfully Signed up!", user: returnedUser }, "success");
                });
            });
        } else {
            sendJSON(res, { message: "No password given" }, "error");
        }
    } else if(req.body.admincode) {
        sendJSON(res, { message: "Wrong Admin Code" }, "error");
    } else {
        sendJSON(res, { message: "No Admin Signup Code" }, "error");
    }
});
router.post("/checkuser", middleware.api.loggedInOnly, function(req, res){
    sendJSON(res, { message: "You are logged in" }, "success");
});
router.get("/profile", middleware.api.loggedInOnly, function(req, res){
    User.findOne({ username: req.user.username }).populate("campgrounds comments").exec(function(err, foundUser){
        if(err){
            sendJSON(res, { message: "Error finding user", error: err }, "error")
        } else if(foundUser){
            sendJSON(res, sinceCreated.object(foundUser), "user")
        } else {
            sendJSON(res, { message: "No User Found!"}, "error")
        }
    })
})
router.get("/profile/:username", function(req, res){
    User.findOne({ username: req.params.username }).populate("campgrounds comments").exec(function(err, foundUser){
        if(err){
            sendJSON(res, { message: "Error finding user", error: err }, "error")
        } else if(foundUser){
            sendJSON(res,
                sinceCreated.arrayAndObject(sinceCreated.arrayAndObject(foundUser, "campgrounds"), "comments"),
                "user")
        } else {
            sendJSON(res, { message: "No User Found!"}, "error")
        }
    })
})
router.delete("/user/delete", middleware.api.isntAdmin, function(req, res){
    deleteUser(req.user._id, req, function(data){
        res.json(data);
    });
});
router.delete("/user/delete/:uid", middleware.api.isAdmin, function(req, res){
    deleteUser(req.params.uid, req, function(data){
        res.json(data);
    });
});

// CAMPGROUNDS
// Getting
router.get("/campgrounds", function(req, res){
	Campground.find({}).populate("comments").exec(function(err, allCampgrounds){
		if(err){
            sendJSON(res, { message: "Error finding any campgrounds", error: err }, "error")
		} else {
            sendJSON(res, sinceCreated.array(allCampgrounds), "campgrounds");
		}
	});
});
router.get("/campgrounds/search", function(req, res){
    if (typeof req.query.q != "string") {
        console.log(req.query.q);
        req.body.q = ""
    }
    Campground.find({ $text: { $search: req.query.q } }).populate("comments").exec(function(err, foundCampgrounds) {
        if (err) {
            sendJSON(res, { message: "Error searching campgrounds", error: err }, "error");
        } else {
            sendJSON(res, sinceCreated.array(foundCampgrounds), "campgrounds");
        }
    })
});
router.get("/campgrounds/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
            sendJSON(res, { message: "Error finding campground", error: err }, "error")
		} else {
			if(foundCampground){
                sendJSON(res, sinceCreated.arrayAndObject(foundCampground, "comments"), "campground")
			} else {
                sendJSON(res, { message: "No Campground found" }, "error")
			}
		}
	});
});
// Modifying
router.post("/campgrounds", middleware.api.loggedInOnly, function(req, res){
    var bodyCampground = req.body.campground || req.body
    var newCampground = {
        name: bodyCampground.name || "Untitled",
        price: bodyCampground.price || 0,
        img: bodyCampground.img,
        description: bodyCampground.description || "No Description"
    }
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    newCampground.author = author;
    User.findById(req.user._id, function(userErr, foundUser){
        Campground.create(newCampground, function(campgroundErr, newCamp){
    		if(campgroundErr){
                sendJSON(res, { message: "Error creating campground", error: campgroundErr }, "error")
    		} else {
                if(!userErr && foundUser){
                    foundUser.campgrounds.push(newCamp._id);
                    foundUser.save();
                } else {
                    return sendJSON(res, { message: "Successfully created campground, but no user to be found...", campground: newCamp }, "success")
                }
                sendJSON(res, { message: "Successfully created campground with user", user: foundUser, campground: newCamp }, "success")
    		}
    	});
    });
});
router.put("/campgrounds/:id", middleware.api.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            sendJSON(res, { message: "Error finding campground to update", error: err }, "error")
        } else {
            Campground.updateOne({ _id: foundCampground._id }, { $set: req.body.campground }, function(err, updatedCampground){
                if(err || !updatedCampground){
                    sendJSON(res, { message: "Error updating campground", error: err}, "error")
                } else {
                    sendJSON(res, { message: "Successfully updated campground" }, "success")
                }
            });
        }
    });
});
router.delete("/campgrounds/:id", middleware.api.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            sendJSON(res, { message: "No Campgroud found to delete", error: err }, "error");
        } else {
            Campground.deleteOne({ _id: foundCampground._id }, function(err){
                if(err){
                    sendJSON(res, { message: "Error deleting campground", error: err }, "error");
                } else {
                    User.findById(foundCampground.author.id, function(err, foundUser){
                        var errors = [];
                        if(!err && foundUser){
                            var campgroundIndex = foundUser.campgrounds.findIndex(function(c){
                                return c.equals(foundCampground._id);
                            })
                            foundUser.campgrounds.splice(campgroundIndex, 1);
                            foundUser.save();
                        } else {
                            errors.push("Error finding associated user");
                        }
                        if(foundCampground.comments.length > 0){
                            Comment.findById(foundCampground.comments[0], function(err, foundComment){
                                if(err || !foundComment){
                                    errors.push("Error finding comment to delete")
                                } else {
                                    var campgroundInfo = foundComment.campground;
                                    Comment.deleteMany({ campground: campgroundInfo }, function(err){
                                        if(err){
                                            errors.push("Error deleting comments")
                                        }
                                        if(errors.length > 0){
                                            sendJSON(res, { message: "Deleted campground but some errors occured. See \"errors\"", errors: errors }, "success")
                                        } else {
                                            sendJSON(res, { message: "Successfully deleted campground and comments" }, "success")
                                        }
                                    });
                                }
                            });
                        } else {
                            sendJSON(res, { message: "Successfully deleted campground!" }, "success");
                        }
                    });
                }
            });
        }
    });
});

// COMMENTS
router.post("/campgrounds/:id/comments", middleware.api.loggedInOnly, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
            sendJSON(res, { message: "Error finding associated campground", error: err }, "error");
		} else if(campground){
            var commentObject = {
                text: "Comment not found"
            }
            if (req.body.text) {
                commentObject = {
                    text: req.body.text
                }
            } else if (req.body.comment) {
                commentObject = req.body.comment
            }
			Comment.create(commentObject, function(err, comment){
				if(err || !comment){
                    sendJSON(res, { message: "Error creating comment", error: err }, "error");
				} else {
                    comment.author.username = req.user.username;
                    comment.author.id = req.user._id;
                    comment.campground.name = campground.name;
                    comment.campground.id = campground._id;
                    comment.save();
					campground.comments.push(comment);
					campground.save();
                    User.findById(req.user._id, function(err, user){
                        if(err){
                            sendJSON(res, { message: "Error finding associated user", error: err }, "error");
                        } else {
                            user.comments.push(comment._id);
                            user.save();
                            sendJSON(res, { message: "Successfully created comment and saved it to user!" }, "success")
                        }
                    });
				}
			});
		} else {
            sendJSON(res, { message: "No campground associated" }, "error");
        }
	});
})
router.put("/campgrounds/:id/comments/:commentid", middleware.api.ownsCommentOnly, function(req, res){
    Comment.updateOne({ _id: req.params.commentid }, { $set: req.body.comment }, function(err, comment){
        if(err){
            sendJSON(res, { message: "Error updating comment", error: err }, "error");
        } else if(comment) {
            sendJSON(res, { message: "Successfully updated Campground!" }, "success")
        } else {
            sendJSON(res, { message: "No comment was updated" }, "error");
        }
    });
});
router.delete("/campgrounds/:id/comments/:commentid", middleware.api.ownsCommentOnly, function(req, res){
    Comment.findById(req.params.commentid, function(err, foundComment){
        if(err){
            sendJSON(res, { message: "Error finding comment to delete", error: err }, "error")
        } else {
            Comment.deleteOne({ _id: req.params.commentid }, function(err){
                if(err){
                    sendJSON(res, { message: "Error deleting comment", error: err }, "error");
                } else {
                    User.findById(foundComment.author.id, function(err, foundUser){
                        if(!err && foundUser) {
                            var commentIndex = foundUser.comments.findIndex(function(c){
                                return c.equals(foundComment._id);
                            })
                            foundUser.comments.splice(commentIndex, 1);
                            foundUser.save();
                        }
                        sendJSON(res, { message: "Successfully deleted comment" }, "success");
                    })
                }
            });
        }
    });
});

// Other
router.get("*", function(req, res){
    sendJSON(res, { message: "404. Page not found, make sure you are using correct version of the API and everything is spelled correctly" }, "error");
});
router.post("*", function(req, res){
    sendJSON(res, { message: "404. Page not found, make sure you are using correct version of the API and everything is spelled correctly" }, "error");
});

module.exports = router
