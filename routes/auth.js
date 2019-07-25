
var express     = require("express"),
    router      = express.Router(),
    User        = require("../models/user"),
    passport    = require("passport");

// AUTH ROUTES
// ADD a user
router.get("/register", function(req, res){
	res.render("users/register");
})
// CREATE a user
router.post("/register", function(req, res){
	var newUser = new User({ username: req.body.username })
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log("Error logging in", err);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/campgrounds");
		});
	});
})
// LOGIN a user
router.get("/login", function(req, res){
	res.render("users/login");
})
// HANDLE a user login
router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}));
// LOGOUT a user
router.get("/logout", function(req, res){
	req.logout();
	res.redirect("/campgrounds");
})

module.exports = router;
