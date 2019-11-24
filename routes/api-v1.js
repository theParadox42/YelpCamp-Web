var express     = require("express"),
    router      = express.Router({ mergeParams: true }),
    mongoose    = require("mongoose"),
    Campground  = require("../models/campground"),
    User        = require("../models/user"),
    middleware  = require("../middleware");
//My first version of a yelpcamp API
