
var express = require("express"),
    router  = express.Router();

// ROUTES
// Home
router.get("/", function(req, res){
	res.render("landing");
});
// Contact
router.get("/contact", function(req, res){

});
// 404s
router.get("*", function(req, res){
    res.render("404");
});
router.post("*", function(req, res){
    req.flash("error", "Not a valid post route!");
    res.redirect("/campgrounds");
});

module.exports = router;
