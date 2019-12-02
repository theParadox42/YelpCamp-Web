// require('dotenv').config();

var Env = process.env;
module.exports = 'mongodb+srv://'
    + Env.DB_USER + ':' + Env.DB_PASS + '@data-sodyq.mongodb.net/' + Env.DB + '?retryWrites=true&w=majority'
