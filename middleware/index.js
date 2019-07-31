// Middleware file

var Campground  = require("../models/campground"),
    Comment     = require("../models/comment");

module.exports = {
    https: function (req, res, next) {
        // The 'x-forwarded-proto' check is for Heroku
        if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
            return res.redirect('https://' + req.get('host') + req.url);
        }
        next();
    },
    loggedInOnly: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error", "You need to be logged in to do that!")
        res.redirect("/login");
    },
    ownsCampgroundOnly: function(req, res, next){
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                    req.flash("error", "Campground not found");
                    res.redirect("back");
                } else if(foundCampground.author.id.equals(req.user._id) || req.user.admin){
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that")
                    res.redirect("back");
                }
            });
        } else {
            req.flash("error", "You need to be logged in to do that!")
            res.redirect("back");
        }
    },
    ownsCommentOnly: function(req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.commentid, function(err, foundComment){
                if(err){
                    req.flash("Comment not found");
                    res.redirect("back");
                } else if(foundComment.author.id.equals(req.user._id) || req.user.admin){
                    next();
                } else {
                    req.flash("Permission denied");
                    res.redirect("back");
                }
            });
        } else {
            req.flash("You need to be logged in to do that");
            res.redirect("back");
        }
    }
};
