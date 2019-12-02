
var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    mongoose    = require("mongoose"),
    Campground  = require("../models/campground"),
    User        = require("../models/user"),
    middleware  = require("../middleware"),
    multer = require('multer');

// Cloudinary stuff
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'paradox-programming',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// CAMPGROUND ROUTES
// INDEX view campgrounds
router.get("/", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            req.flash("error", "Error getting campgrounds")
            res.redirect("/error")
        } else {
            res.render("campgrounds/index", { campgrounds: allCampgrounds });
        }
    });
});
// ADD add campground
router.get("/new", middleware.loggedInOnly, function(req, res) {
    res.render("campgrounds/new");
});
// CREATE post to DB
router.post("/", middleware.loggedInOnly, upload.single('image'), function(req, res) {

    if(req.file){
        cloudinary.uploader.upload(req.file.path, function(result) {
            var newCampground = req.body.campground;
            // add cloudinary url for the image to the campground object under image property
            newCampground.img = result.secure_url;
            var author = {
                id: req.user._id,
                username: req.user.username
            };
            newCampground.author = author;
            User.findById(req.user._id, function(userErr, foundUser){
                Campground.create(newCampground, function(campgroundErr, newCamp){
                    if(campgroundErr){
                        req.flash("error", "Error making campground")
                        res.redirect("/campgrounds/new");
                    } else {
                        req.flash("success", "Campground: " + newCamp.name + " created!")
                        if(!userErr && foundUser){
                            foundUser.campgrounds.push(newCamp._id);
                            foundUser.save();
                        } else {
                            req.flash("error", "Error with user");
                        }
                        res.redirect("/campgrounds");
                    }
                });
            });
        });
    } else {
        req.flash("error", "No Image Found");
        res.redirect("/campgrounds/new");
    }
});
// Search campgrounds
router.get("/search", function(req, res) {
    if (typeof req.query.q != "string") {
        req.query.q = ""
    }
    console.log(typeof req.query.q);
    Campground.find({ $text: { $search: req.query.q } }, function(err, foundCampgrounds) {
        if (err) {
            console.log(err);
            req.flash("error", "Couldn't perfom search")
            res.redirect("/campgrounds");
        } else {
            res.render("campgrounds/search", { campgrounds: foundCampgrounds, query: req.query.q })
        }
    })
})
// SHOW campground
router.get("/:id", function(req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            req.flash("error", "Error finding campground")
            res.redirect("/campgrounds");
        } else {
            if(foundCampground){
                res.render("campgrounds/show", { campground: foundCampground });
            } else {
                req.flash("error", "Campground not found")
                res.redirect("/campgrounds");
            }
        }
    });
});
// EDIT campground
router.get("/:id/edit", middleware.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            req.flash("Error finding campground");
            res.redirect("/campgrounds/"+req.params.id);
        } else {
            res.render("campgrounds/edit", { campground: foundCampground });
        }
    });
});
// UPDATE campground
router.put("/:id", middleware.ownsCampgroundOnly, upload.single('image'), function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            function updateCampground(){
                Campground.updateOne({ _id: foundCampground._id }, { $set: req.body.campground }, function(err, updatedCampground){
                     if(err || !updatedCampground){
                         req.flash("error", "Error updating campground");
                         res.redirect("/campgrounds/" + req.params.id);
                     } else {
                         res.redirect("/campgrounds/" + req.params.id);
                     }
                 });
            }
            if(req.file){
                cloudinary.uploader.upload(req.file.path, function(result) {
                   // add cloudinary url for the image to the campground object under image property
                   req.body.campground.img = result.secure_url;
                   updateCampground();
                });
            } else {
                req.body.campground.img = foundCampground.img;
                updateCampground();
            }
        }
    });
});
// DELETE campground
router.delete("/:id", middleware.ownsCampgroundOnly, function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", err?"Error finding campground to delete":"No campground found for deletion");
            res.redirect("/campgrounds/" + req.params.id);
        } else {
            Campground.deleteOne({ _id: foundCampground._id }, function(err){
                if(err){
                    req.flash("error", "Error deleting campground");
                    res.redirect("/campgrounds/" + req.params.id);
                } else {
                    User.findById(foundCampground.author.id, function(err, foundUser){
                        if(!err && foundUser){
                            var campgroundIndex = foundUser.campgrounds.findIndex(function(c){
                                return c.equals(foundCampground._id);
                            })
                            foundUser.campgrounds.splice(campgroundIndex, 1);
                            foundUser.save();
                        } else {
                            req.flash("error", "No user associated with campground");
                        }
                        if(foundCampground.comments.length > 0){
                            Comment.findById(foundCampground.comments[0], function(err, foundComment){
                                if(err || !foundComment){
                                    req.flash("error", "Error finding comments associated with comment");
                                    res.redirect("/campgrounds");
                                } else {
                                    var campgroundInfo = foundComment.campground;
                                    Comment.deleteMany({ campground: campgroundInfo }, function(err){
                                        if(err){
                                            req.flash("error", "Error deleting associated comments")
                                        }
                                        res.redirect("/campgrounds");
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


module.exports = router;
