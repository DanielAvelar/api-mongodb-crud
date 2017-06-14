var formattingResponse = require('../configuration/formatting');
var User = require('../models/userModel'); // get our mongoose model

// Route new user.
exports.newUser = function(req, res){
    res.render('createUser', {
    title: 'Create Users'
  });
}

//Create user for mongodb.
exports.createUser = function(req, res){
    if (req.body.name && req.body.password && req.body.admin) {
    // Find a single movie by name.
    User.find({
      name: req.body.name
    }, function (err, user) {
      if (err) {
        formattingResponse(res, 422, 'error', 'Create user', err);
      } else {
        if (user.length > 0) {
          formattingResponse(res, 503, 'error', 'Create user', 'User exists');
        } else {
          // create a sample user
          var newUser = new User({
            name: req.body.name,
            password: req.body.password,
            admin: req.body.admin.toString().toUpperCase() === 'ON' ? true : false
          });
          newUser.save(function (err) {
            if (err) {
              formattingResponse(res, 503, 'error', 'Create user', err);
            } else {
              res.render('success', {
                title: 'User create'
              });
            }
          });
        }
      }
    });
  } else {
    formattingResponse(res, 422, 'error', 'Create user', 'Parameters invalid.');
  }
}