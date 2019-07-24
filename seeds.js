var mongoose    = require('mongoose'),
    Campground  = require('./models/campground'),
    Comment     = require('./models/comment');

var data = [
    {
        name: "Ocean Reservoir",
        img: "https://images.unsplash.com/photo-1526491109672-74740652b963?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
        description: "Enjoy the ocean with some nice rocks and trees"
    },
    {
        name: "The Woods",
        img: "https://images.unsplash.com/photo-1519395612667-3b754d7b9086?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
        description: "Campground surrounded by trees"
    },
    {
        name: "Mountain Campground",
        img: "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60",
        description: "Mountain camping grounds. Beautiful sunsets"
    }
]

function seedDB() {
    // Remove campgrounds
    Campground.deleteMany({}, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Removed Campgrounds!")

            Comment.deleteMany({}, function(err){
                if(err) {
                    console.log(err);
                } else {
                    // Add a few campgrounds
                    data.forEach(function(seed){
                        Campground.create(seed, function(err, campground){
                            if(err){
                                console.log(err);
                            } else {
                                console.log("Added a campground")
                                // create a comment
                                Comment.create({
                                    text: "Awesome Place! No internet",
                                    author: "Fred Gills"
                                }, function(err, comment){
                                    if(err){
                                        console.log(err);
                                    } else {
                                        campground.comments.push(comment);
                                        campground.save();
                                    }
                                })
                            }
                        })
                    })    
                }
            })
        }
    });
}

module.exports = seedDB;
