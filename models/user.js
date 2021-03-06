var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    admin: Boolean,
    sinceCreated: String,
    campgrounds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campground"
        }
    ],
	comments: [
        {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
        }
	]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
