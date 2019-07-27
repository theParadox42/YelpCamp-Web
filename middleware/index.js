// Middleware file

var Campground  = require("../models/campground"),
    Comment     = require("../models/comment");

module.exports = {
    loggedInOnly: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        res.redirect("/login");
    },
    ownsCampgroundOnly: function(req, res, next){
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                    res.redirect("back");
                } else if(foundCampground.author.id.equals(req.user._id) || req.user.admin){
                    next();
                } else {
                    res.redirect("back");
                }
            });
        } else {
            res.redirect("back");
        }
    },
    ownsCommentOnly: function(req, res, next){
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
            res.redirect("back");
        }
    }
};
