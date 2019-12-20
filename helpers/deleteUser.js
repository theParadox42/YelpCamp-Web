
var express = require("express"),
    User    = require("../models/user"),
    Comment = require("../models/comment"),
    Campground  = require("../models/campground"),
    mongoose    = require("mongoose"),
    ObjectId    = mongoose.Types.ObjectId;

// DESTROY a user
function deleteUser(uid, req, callback){

    function sendResponse(type, message, error) {
        var response = {
            type: type,
            data: {
                message: message
            }
        }
        if(error){
            response.data.error = error;
        }
        callback(response)
    }

    User.findById(uid).populate("campgrounds comments").exec(function(err, foundUser){
        if(err || !foundUser){
            sendResponse("error", "No User Found!", err)
        } else {
            User.deleteOne({ _id: uid }, function(err){
                if(err){
                    sendResponse("error", "Error Deleting User!", err);
                } else {
                    var authorId = new ObjectId(uid);
                    Comment.deleteMany({ "author.id": authorId }, function(err){
                        if(err){
                            sendResponse("success", "Deleted user, but failed to delete comments!", err);
                        }
                        Campground.deleteMany({ "author.id": authorId }, function(err){
                            if(err){
                                sendResponse("success", "Deleted User, but failed to delete campgrounds!", err)
                            } else {
                                sendResponse("success", "Successfully deleted user data!")
                            }
                        })
                    })
                }
                req.logout();
            })
        }
    });
};

module.exports = deleteUser
