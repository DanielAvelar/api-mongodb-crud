var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var formattingResponse = require('../configuration/formatting');
var User = require('../models/userModel'); // get our mongoose model
var config = require('../configuration/access'); // get our config file

// Authentication (no middleware necessary since this isnt authenticated)
exports.authenticate = function (req, res) {
  if (User.db.readyState === 0) {
    if (req.query.retornoJson === "true") {
      res.status(503)
      res.send({
        message: 'Unable to communicate with database',
        session: '',
        authentication: false
      })
    } else {
      formattingResponse(res, 503, 'errorLogin', 'Database', 'Unable to communicate with database');
    }
  } else {
    // find the user
    User.findOne({
      name: req.body.name
    }, function (err, user) {
      if (err) {
        if (req.query.retornoJson === "true") {
          res.status(503)
          res.send({
            message: err,
            session: '',
            authentication: false
          })
        } else {
          formattingResponse(res, 503, 'errorLogin', 'Authenticate', err);
        }
      }
      if (!user) {
        if (req.query.retornoJson === "true") {
          res.status(401)
          res.send({
            message: 'Authentication failed. User not found.',
            session: '',
            authentication: false
          })
        } else {
          formattingResponse(res, 401, 'errorLogin', 'Authenticate', 'Authentication failed. User not found.');
        }
      } else if (user) {
        // check if password matches
        if (user.password != req.body.password) {
          if (req.query.retornoJson === "true") {
            res.status(401)
            res.send({
              message: 'Authentication failed. Wrong password.',
              session: '',
              authentication: false
            })
          } else {
            formattingResponse(res, 401, 'errorLogin', 'Authenticate', 'Authentication failed. Wrong password.');
          }
        } else {
          // if user is found and password is right
          // create a token
          var token = jwt.sign(user.toJSON(), config.secret, {
            expiresIn: 600 // expires in 10 minutes.
          });
          req.session['x-access-token'] = token;

          if(req.query.retornoJson === "true"){
            res.send({
              message: 'success',
              session: token,
              authentication : true
            })
          }else{
            if (req.query.retornoJson === "true") {
              res.status(200)
              res.send({
                message: 'Success',
                retorno: true
              })
            } else {
              res.render('success', {
                title: 'Authentication'
              });
            }
          }
        }
      }
    });
  }
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