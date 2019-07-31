var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    mongoose    = require("mongoose"),
    ObjectId    = mongoose.Types.ObjectId,
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    User        = require("../models/user"),
    middleware  = require("../middleware");

// AUTH ROUTES
// Redirect to your account
router.get("/profile", function(req, res){
    if(req.user){
        res.redirect("/profile/" + req.user.username);
    } else {
        res.redirect("/campgrounds");
    }
})
// SHOW a user (you)
router.get("/profile/:username", function(req, res){
    User.findOne({ username: req.params.username }).populate("campgrounds comments").exec(function(err, foundUser){
        if(err){
            req.flash("error", "Error finding user");
            res.redirect("/campgrounds");
        } else if(foundUser){
            res.render("users/profile", { profile: foundUser })
        } else {
            req.flash("error", "No user found!");
            res.redirect("/campgrounds");
        }
    })
})
// ADD a user
router.get("/register", middleware.https, function(req, res){
	res.render("users/register");
})
// CREATE a user
router.post("/register", function(req, res){
    if(req.body.admincode == process.env.ADMIN_CODE) {
        if(req.body.password.first === req.body.password.second) {
            var newUser = new User({ username: req.body.username, email: req.body.email });
            User.register(newUser, req.body.password, function(err, newUser){
                if(err){
                    req.flash("error", err.message);
                    return res.redirect("/register");
                }
                passport.authenticate("local")(req, res, function(){
                    req.flash("success", "Welcome to YelpCamp " + newUser.username)
                    res.redirect("/profile");
                });
            });
        } else {
            if(req.body.password.first && req.body.password.second) {
                req.flash("error", "Passwords did not match");
            } else if(req.body.password.first){
                req.flash("error", "Confirmation password required")
            } else if(req.body.password.second) {
                req.flash("error", "Please enter a password");
            }
            res.redirect("/register")
        }
    } else if(req.body.admincode) {
        req.flash("error", "Wrong admin code!");
        res.redirect("/register");
    } else {
        req.flash("error", "No admin code!");
        res.redirect("/register");
    }
})
// LOGIN a user
router.get("/login", middleware.https, function(req, res){
    if(req.query.error){
        req.flash("error", "Error signing in. Make sure the username & password are correct");
        res.redirect("/login");
    } else {
    	res.render("users/login");
    }
})
// HANDLE a user login
router.post("/login", passport.authenticate("local", {
	successRedirect: "/profile",
	failureRedirect: "/login?error=1"
}));
// LOGOUT a user
router.get("/logout", function(req, res){
	req.logout();
    req.flash("success", "Logged you out!");
	res.redirect("/campgrounds");
})
// DELETE a user
router.get("/user/delete", middleware.loggedInOnly, function(req, res){
    res.render("users/delete");
})
// DESTROY a user
router.delete("/user/delete", middleware.loggedInOnly, function(req, res){
    User.findById(req.user._id).populate("campgrounds comments").exec(function(err, foundUser){
        if(err || !foundUser){
            req.flash("error", err?"Error finding user to delete":"No user found to delete");
            res.redirect("/profile");
        } else {
            User.deleteOne({ _id: req.user._id }, function(err){
                if(err){
                    req.flash("error", "Error deleting user");
                    res.redirect("/profile");
                } else {
                    var authorId = new ObjectId(req.user._id);
                    Comment.deleteMany({ "author.id": authorId }, function(err){
                        if(err){
                            req.flash("error", "Error deleting associated comments");
                        }
                        Campground.deleteMany({ "author.id": authorId }, function(err){
                            if(err){
                                req.flash("error", "Error deleting associated campgrounds");
                            }
                            res.redirect("/logout");
                        })
                    })
                }
            })
        }
    })
})

module.exports = router;
