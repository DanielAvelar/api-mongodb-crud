var MongoClient = require('mongodb').MongoClient;
var config = require('../configuration/access'); // get our config file
var dbHost = config.databaseApi;

// Function of connection on mongodb.
module.exports = function connection(req, res, callback) {
  MongoClient.connect(dbHost, function(err, db) {
    if (err) {
      msg = 'Could not connect to server: ' + err.message.replace('getaddrinfo ENOTFOUND ', '').replace('connect ETIMEDOUT ', '');
      callback(msg, null);
    } else {
      callback(null, db);
    }
  });
}