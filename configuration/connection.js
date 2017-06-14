var MongoClient;
var config = require('../configuration/access'); // get our config file
var dbHost = config.databaseApi;

// Function of connection on mongodb.
module.exports = function connection(req, res, callback) {
  MongoClient = require('mongodb').MongoClient;
  MongoClient.connect(dbHost, function(err, db) {
    if (err) {
      msg = 'Could not connect to server: ' + err.message.replace('getaddrinfo ENOTFOUND ', '').replace('connect ETIMEDOUT ', '');
      callback(msg, null);
    } else {
      db.authenticate(config.user, config.password, function(err, res) {
        if(err){
          db.close();
          callback(err, null);
        }
        console.log('Authenticate in databaseApi: ' + res)
      });
      callback(null, db);
    }
  });
}