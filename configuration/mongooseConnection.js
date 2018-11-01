// Get our config file
var config = require('./access');

// Change Color.
var clc = require('cli-color');

// Bring Mongoose into the app 
var mongoose = require( 'mongoose' ); 

// Build the connection string 
var dbURI = config.databaseUsers; 

// Create the database connection 
mongoose.connect(dbURI, { useNewUrlParser: true }); 

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  console.log(clc.blueBright('Mongoose connected'));
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log(clc.blueBright('Mongoose default connection error: ' + err));
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log(clc.blueBright('Mongoose default connection disconnected')); 
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log(clc.blueBright('Mongoose default connection disconnected through app termination')); 
    process.exit(0); 
  }); 
});

// BRING IN YOUR SCHEMAS & MODELS
require('./../models/userModel'); 