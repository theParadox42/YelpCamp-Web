
var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    User        = require("../models/user"),
    passport    = require("passport");

// AUTH ROUTES
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
router.get("/register", function(req, res){
	res.render("users/register");
})
// CREATE a user
router.post("/register", function(req, res){
    if(req.body.admincode == process.env.ADMIN_CODE) {
        var newUser = new User({ username: req.body.username })
        User.register(newUser, req.body.password, function(err, user){
            if(err){
                req.flash("error", err.message);
                return res.redirect("/register");
            }
            passport.authenticate("local")(req, res, function(){
                req.flash("success", "Welcome to YelpCamp " + req.user.username)
                res.redirect("/profile");
            });
        });
    } else if(req.body.admincode) {
        req.flash("error", "Wrong admin code!");
        res.redirect("/register");
    } else {
        req.flash("error", "No admin code!");
        res.redirect("/register");
    }
})
// LOGIN a user
router.get("/login", function(req, res){
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

module.exports = router;
