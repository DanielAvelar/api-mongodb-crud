var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var clc = require('cli-color');
var MongoClient = require('mongodb').MongoClient;
var myCollection = "products";
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./models/user'); // get our mongoose model
var dbHost = config.databaseApi;
var port = process.env.PORT || 54000; // used to create, sign, and verify tokens
var msg;
var formidable = require('formidable');
var fs = require('fs');

mongoose.connect(config.databaseUsers); // connect to database

app.use(bodyParser.urlencoded({
  extended: false
}));

// Route Index.
app.use('/', require('./routes/index'));
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev')); // use morgan to log requests to the console
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'API_MONGO'
}));

app.set('superSecret', config.secret); // secret variable
app.set('view engine', 'jade');

//Route of Login
app.get('/login', require('./routes/login'));
// Select All Product for database.
app.get('/getProductsNoAuth', require('./routes/getProductsNoAuth'));

// Get an instance of the router for api routes
var apiRoutes = express.Router();

// Authentication (no middleware necessary since this isnt authenticated)
apiRoutes.post('/authenticate', function(req, res) {
  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {
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
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1800 // expires in 30 minutes.
        });
        req.session['x-access-token'] = token;
        res.render('success', {
          title: 'Authentication'
        });
      }
    }
  });
});

// Route Middleware to Authenticate and Check Token.
apiRoutes.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.param('token') || req.headers['x-access-token'] || req.session['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
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
});

// ---------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------
apiRoutes.get('/', function(req, res) {
  res.render('login', {
    title: 'Authenticate'
  });
});

// Route logout user for system.
apiRoutes.get('/logout', function(req, res) {
  req.session.destroy();
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.render('login', {
    title: 'Authenticate'
  });
});

// Route create user for database.
apiRoutes.get('/createUser', function(req, res) {
  res.render('createUser', {
    title: 'Create Users'
  });
});

// Create user for database.
apiRoutes.post('/setup', function(req, res) {
  if (req.body.name && req.body.password && req.body.admin) {
    // Find a single movie by name.
    User.find({
      name: req.body.name
    }, function(err, user) {
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
          newUser.save(function(err) {
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
});

// Select All Product for database.
apiRoutes.get('/getProducts', function(req, res) {
  connection(req, res, function(err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({}, {}, {}).toArray(
        function(err, docs) {
          var listProducts = [];
          for (index in docs) {
            listProducts.push(docs[index]);
          }
          //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
          res.format({
            //HTML response will render the index.jade file in the views folder. We are also setting "Products" to be an accessible variable in our jade view
            html: function() {
              res.render('index', {
                title: 'List of Products',
                "products": listProducts
              });
            },
            //JSON response will show all Products in JSON format
            json: function() {
              res.json(listProducts);
            }
          });
        }
      );
    }
  });
});

// Select one Product for database by idProduct.
apiRoutes.get('/getOneProduct/:idProduct', function(req, res) {
  var idProduct = req.params.idProduct;
  var edit = req.query.edit === 'true' ? true : false;
  connection(req, res, function(err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function(err, docs) {
          if (docs.length == 0) {
            formattingResponse(res, 422, 'error', 'getOneProduct', "Product with idProduct " + idProduct + " not found");
          } else {
            if (edit) {
              res.format({
                //HTML response will render the 'edit.jade' template
                html: function() {
                  res.render('edit', {
                    title: 'Edit Product',
                    "product": docs[0]
                  });
                },
                //JSON response will return the JSON output
                json: function() {
                  res.json(docs[0]);
                }
              });
            } else {
              res.format({
                //HTML response will render the 'show.jade' template
                html: function() {
                  res.render('show', {
                    title: 'Show Product',
                    "product": docs[0]
                  });
                },
                //JSON response will return the JSON output
                json: function() {
                  res.json(docs[0]);
                }
              });
            }
          }
        }
      );
    }
  });
});

// Route insert one Products in database.
apiRoutes.get('/newProduct', function(req, res) {
  res.render('insertProduct', {
    title: 'Insert Product',
    message_erro: ''
  });
});

// Insert one or more Products in database.
apiRoutes.post('/insertProducts', function(req, res) {
  var listProducts = [];
  var countProducts = 0;
  var listidProduct = [];
  var lintCont;

  connection(req, res, function(err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      listProducts.push({
        'name': req.body.name,
        'idProduct': req.body.idProduct,
        'description': req.body.description,
        'amount': req.body.amount,
        'category': req.body.category,
        'price': req.body.price
      });
      listidProduct.push(req.body.idProduct);
      db.collection(myCollection).find({
        'idProduct': {
          '$in': listidProduct
        }
      }).toArray(
        function(err, docs) {
          if (docs.length > 0) {
            var result = docs.map(function(a) {
              return a.idProduct;
            });
            formattingResponse(res, 422, 'error', 'insertProducts', "Product(s) with idProduct " + result.join(', ') + " already exists.");
          } else {
            db.collection(myCollection).insert(listProducts, function(err, docs) {
              if (err) {
                formattingResponse(res, 503, 'error', 'Insert', err);
              } else {
                formattingResponse(res, 200, 'success', 'Insert', "Successfully inserted the Product into database");
              }
            });
          }
        }
      );
    }
  });
});

// Update a Product in database.
apiRoutes.post('/updateProduct/:idProduct', function(req, res) {
  var ProductName = req.body.name;
  var description = req.body.description;
  var amount = req.body.amount;
  var category = req.body.category;
  var price = req.body.price;
  var idProduct = req.params.idProduct;

  connection(req, res, function(err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function(err, docs) {
          if (docs.length == 0) {
            formattingResponse(res, 422, 'error', 'Update', "Product with idProduct " + idProduct + " not found");
          } else {
            db.collection(myCollection).update({
              "idProduct": idProduct
            }, {
              'name': ProductName,
              'description': description,
              'amount': amount,
              'idProduct': idProduct,
              'category': category,
              'price': price
            }, function(err, docs) {
              if (err) {
                formattingResponse(res, 503, 'error', 'Update', err);
              } else {
                formattingResponse(res, 200, 'success', 'Update', "Successfully update the Product into database");
              }
            });
          }
        }
      );
    }
  });
});

// Delete a Product in database.
apiRoutes.post('/deleteProduct/:idProduct', function(req, res) {
  var idProduct = req.params.idProduct;
  connection(req, res, function(err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function(err, docs) {
          if (docs.length === 0) {
            formattingResponse(res, 422, 'error', 'Delete', "Product with idProduct " + idProduct + " not found");
          } else {
            db.collection(myCollection).remove({
              idProduct: docs[0].idProduct
            }, function(err, docs) {
              if (err) {
                formattingResponse(res, 503, 'error', 'Delete', err);
              } else {
                formattingResponse(res, 200, 'success', 'Delete', "Successfully deleted the Product into database");
              }
            });
          }
        }
      );
    }
  });
});

// Function of connection on mongodb.
function connection(req, res, callback) {
  MongoClient.connect(dbHost, function(err, db) {
    if (err) {
      msg = 'Could not connect to server: ' + err.message.replace('getaddrinfo ENOTFOUND ', '').replace('connect ETIMEDOUT ', '');
      callback(msg, null);
    } else {
      callback(null, db);
    }
  });
}

// Function for formatting response of Database.
function formattingResponse(response, status, view, title, message) {
  response.status(status);
  response.format({
    //HTML response will render the view template.
    html: function() {
      response.render(view, {
        "title": title,
        "message": message
      });
    },
    //JSON response will return the JSON output
    json: function() {
      response.json(message);
    }
  });
}

// All of our routes will be prefixed with /api
app.use('/pages', apiRoutes);

// Star the Server
app.listen(port);
console.log(clc.cyanBright('App listening on port %d in %s mode'), port, app.get('env'));