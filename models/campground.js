
var mongoose = require('mongoose');

var campgroundSchema = new mongoose.Schema({
	name: String,
	price: String,
	img: String,
	description: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	]
});
campgroundSchema.index({ name: "text", description: "text"});

module.exports = mongoose.model("Campground", campgroundSchema);
