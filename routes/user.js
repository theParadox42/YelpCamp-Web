var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    mongoose    = require("mongoose"),
    ObjectId    = mongoose.Types.ObjectId,
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    User        = require("../models/user"),
    deleteUser  = require("../helpers/deleteUser"),
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
router.get("/user/delete", middleware.isntAdmin, function(req, res){
    res.render("users/delete");
})
router.get("/user/delete/:uid", middleware.isAdmin, function(req, res){
    User.findById(req.params.uid, function(err, foundUser){
        res.render("users/admindelete", { deleteUser: foundUser });
    })
})
router.delete("/user/delete", middleware.isntAdmin, function(req, res){
    deleteUser(req.user._id, req, function(response){
        req.flash(response.type, response.data.message);
        res.redirect("/");
    });
})
router.delete("/user/delete/:uid", middleware.isAdmin, function(req, res){
    deleteUser(req.params.uid, req, function(response){
        req.flash(response.type, response.data.message);
        res.redirect("/profile");
    });
})

// Send the router info
module.exports = router;
