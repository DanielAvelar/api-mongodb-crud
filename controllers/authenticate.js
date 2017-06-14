var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var formattingResponse = require('../configuration/formatting');
var User = require('../models/userModel'); // get our mongoose model
var config = require('../configuration/access'); // get our config file

// Authentication (no middleware necessary since this isnt authenticated)
exports.authenticate = function(req, res){
    // find the user
  User.findOne({
    name: req.body.name
  }, function (err, user) {
    if (err) formattingResponse(res, 503, 'errorLogin', 'Authenticate', err);
    if (!user) {
      formattingResponse(res, 401, 'errorLogin', 'Authenticate', 'Authentication failed. User not found.');
    } else if (user) {
      // check if password matches
      if (user.password != req.body.password) {
        formattingResponse(res, 401, 'errorLogin', 'Authenticate', 'Authentication failed. Wrong password.');
      } else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, config.secret, {
          expiresIn: 1800 // expires in 30 minutes.
        });
        req.session['x-access-token'] = token;
        res.render('success', {
          title: 'Authentication'
        });
      }
    }
  });
}

exports.checkAuthenticate = function (req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.headers['x-access-token'] || req.session['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, config.secret, function (err, decoded) {
      if (err) {
        formattingResponse(res, 403, 'errorLogin', 'Token Authenticate', 'Failed to authenticate token.');
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    formattingResponse(res, 401, 'errorLogin', 'Token Authenticate', 'No token provided.');
  }
};