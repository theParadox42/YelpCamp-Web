
var express = require("express"),
    router  = express.Router();

// ROUTES
// Home
router.get("/", function(req, res){
	res.render("landing");
});

module.exports = router;
