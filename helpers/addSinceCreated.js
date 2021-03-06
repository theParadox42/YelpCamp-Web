
var moment = require("moment")

module.exports = {
    array: function(arrayOfItems){
        for(var i = 0; i < arrayOfItems.length; i ++){
            arrayOfItems[i].sinceCreated = moment(arrayOfItems[i].createdAt).fromNow()
        }
        return arrayOfItems
    },
    object: function(objectItem){
        objectItem.sinceCreated = moment(objectItem.createdAt).fromNow()
        return objectItem
    },
    arrayAndObject(object, arrayKey){
        for(var i = 0; i < object[arrayKey].length; i ++){
            object[arrayKey][i].sinceCreated = moment(object[arrayKey][i].createdAt).fromNow()
        }
        object.sinceCreated = moment(object.createdAt).fromNow()
        return object
    }
}
