// Middleware file

var Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    sendJSON    = require("../helpers/sendJSON");

var middleware = {
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
    isAdmin: function(req, res, next){
        if(req.user && req.user.admin){
            return next();
        } else if(req.user) {
            req.flash("error", "You need to be an admin to do that!");
            res.redirect("back");
        } else {
            req.flash("error", "You need to login as Admin to do that!");
            res.redirect("/login");
        }
    },
    isntAdmin: function(req, res, next){
        if(req.user) {
            if(req.user.admin){
                req.flash("error", "The Admin can't do that!");
                res.redirect("back");
            } else {
                next();
            }
        } else {
            req.flash("error", "You need to login to do that!");
            res.redirect("/login");
        }
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

middleware.api = {
    loggedInOnly: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        sendJSON(res, { message: "You need to be logged in to do that!" }, "error")
    },
    isAdmin: function(req, res, next){
        if(req.user && req.user.admin){
            return next();
        } else if(req.user) {
            sendJSON(res, { message: "You need to be an admin to do that" }, "error")
        } else {
            sendJSON(res, { message: "You need to login as admin to do that!" }, "error")
        }
    },
    isntAdmin: function(req, res, next){
        if(req.user) {
            if(req.user.admin){
                sendJSON(res, { message: "The admin can't do that!" }, "error")
            } else {
                next();
            }
        } else {
            sendJSON(res, { message: "You need to log in to do that!" }, "error")
        }
    },
    ownsCampgroundOnly: function(req, res, next){
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                    sendJSON(res, { message: "Error finding campground", error: err }, "error")
                } else if(foundCampground.author.id.equals(req.user._id) || req.user.admin){
                    next();
                } else {
                    sendJSON(res, { message: "You don't have control over that campground" }, "error")
                }
            });
        } else {
            sendJSON(res, { message: "You need to be logged in to do that!" }, "error");
        }
    },
    ownsCommentOnly: function(req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.commentid, function(err, foundComment){
                if(err){
                    sendJSON(res, { message: "Error finding comment", error: err }, "error")
                } else if(foundComment.author.id.equals(req.user._id) || req.user.admin){
                    next();
                } else {
                    sendJSON(res, { message: "You don't have control over that comment"})
                }
            });
        } else {
            sendJSON(res, { message: "You need to be logged in to do that!" }, "error")
        }
    }
}


module.exports = middleware;
