
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    Campground  = require("../models/campground"),
    User        = require("../models/user"),
    Comment     = require("../models/comment")
    middleware  = require("../middleware"),
    sendJSON    = require("../models/sendJSON");

//My first version of a YelpCamp API
router.get("/", function(req, res){
    sendJSON(res, { message: "YelpCamp API here!" }, "message")
})

// USER Auth
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
router.post("/login", function(req, res){
    var authentication = passport.authenticate("local", function(err, user){
        if(err){
            sendJSON(res, { message: "Error authenticating", error: err }, "error")
        } else {
            sendJSON(res, { message: "successfully logged in!", user: user }, "success")
        }
    });
    authentication(req, res)
});

// Getting Campgrounds
router.get("/campgrounds", function(req, res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
            sendJSON(res, { message: "Error finding any campgrounds", error: err }, "error")
		} else {
            sendJSON(res, allCampgrounds, "campgrounds");
		}
	});
});
router.get("/campgrounds/search", function(req, res){
    if (typeof req.query.q != "string") {
        console.log(req.query.q);
        req.body.q = ""
    }
    Campground.find({ $text: { $search: req.query.q } }, function(err, foundCampgrounds) {
        if (err) {
            sendJSON(res, { message: "Error searching campgrounds", error: err }, "error");
        } else {
            sendJSON(res, foundCampgrounds, "campgrounds");
        }
    })
});
router.get("/campgrounds/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
            sendJSON(res, { message: "Error finding campground", error: err }, "error")
		} else {
			if(foundCampground){
                sendJSON(res, foundCampground, "campground")
			} else {
                sendJSON(res, { message: "No Campground found" }, "error")
			}
		}
	});
});
// Modifying Campgrounds
router.post("/campgrounds", middleware.loggedInOnly, function(req, res){
    var newCampground = req.body.campground;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    newCampground.author = author;
    User.findById(req.user._id, function(userErr, foundUser){
        Campground.create(newCampground, function(campgroundErr, newCamp){
    		if(campgroundErr){
                sendJSON(res, { message: "Error creating campground", error: campgroundErr }, "")
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
router.put("/campgrounds/:id", middleware.ownsCampgroundOnly, function(req, res){
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

// Other
router.get("*", function(req, res){
    sendJSON(res, { message: "Page not found, make sure you are using correct version of the API and everything is spelled correctly", error: "404" }, "error");
});
router.post("*", function(req, res){
    sendJSON(res, { message: "Page not found, make sure you are using correct version of the API and everything is spelled correctly", error: "404" }, "error");
});

module.exports = router
