
// DESTROY a user
function deleteUser(uid, req, res){

    function sendResponse(type, message, error) {
        return {
            type: type,
            data: {
                message: message,
                error: error || null
            }
        }
    }

    User.findById(uid).populate("campgrounds comments").exec(function(err, foundUser){
        if(err || !foundUser){
            return sendResponse("error", "No User Found!")
        } else {
            User.deleteOne({ _id: uid }, function(err){
                if(err){
                    return sendResponse("error", "Error Deleting User!");
                } else {
                    var authorId = new ObjectId(uid);
                    Comment.deleteMany({ "author.id": authorId }, function(err){
                        if(err){
                            return sendResponse("success", "Deleted user, but failed to delete comments!");
                        }
                        Campground.deleteMany({ "author.id": authorId }, function(err){
                            if(err){
                                return sendResponse("success", "Deleted User, but failed to delete campgrounds!")
                            } else {
                                return sendResponse("success", "Successfully deleted user data!")
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
