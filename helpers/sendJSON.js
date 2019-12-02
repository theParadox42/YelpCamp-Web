
function sendJSON(res, object, type){
    res.json({
        data: object,
        type: type
    })
}

module.exports = sendJSON;
