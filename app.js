var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var clc = require('cli-color');
var morgan = require('morgan');
var mongoose = require('./configuration/mongooseConnection');
var pack = require('./package'); // get our package file
var port = process.env.PORT || 54000; // used to create, sign, and verify tokens

// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------
var productController = require('./controllers/product');
var authenticateController = require('./controllers/authenticate');
var userController = require('./controllers/user');
var noAuth = require('./noAuth');
var login = require('./login');
var logout = require('./logout');
var index = require('./index');

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev')); // use morgan to log requests to the console
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'API_MONGO'
}));

app.set('view engine', 'jade');

// Route Index.
app.route('/').get(index.getIndex);
//Route of Login
app.route('/login').get(login.getLogin);
// Select All Product for database.
app.route('/getProductsNoAuth').get(noAuth.getProductsNoAuth);
// Route logout user for system.
app.route('/logout').get(logout.getLogout);

// Get an instance of the router for api routes
var apiRoutes = express.Router();
// All of our routes will be prefixed with /pages
app.use('/pages', apiRoutes);

// Create endpoint handlers for /authenticate
apiRoutes.route('/authenticate').post(authenticateController.authenticate);
// Route Middleware to Authenticate and Check Token.
apiRoutes.use(authenticateController.checkAuthenticate);

// ---------------------------------------------------------
// Authenticated routes for User
// ---------------------------------------------------------
// Create endpoint handlers for /
apiRoutes.route('/newUser').get(userController.newUser);
// Create endpoint handlers for /createUser
apiRoutes.route('/createUser').post(userController.createUser);

// ---------------------------------------------------------
// Authenticated routes for Products
// ---------------------------------------------------------
// Create endpoint handlers for /
apiRoutes.route('/').get(productController.getProducts);
// Create endpoint handlers for /getProducts
apiRoutes.route('/getProducts').get(productController.getProducts);
// Create endpoint handlers for /getOneProduct/:idProduct
apiRoutes.route('/getOneProduct/:idProduct').get(productController.getOneProduct);
// Create endpoint handlers for /newProduct
apiRoutes.route('/newProduct').get(productController.newProduct);
// Create endpoint handlers for /insertProducts
apiRoutes.route('/insertProducts').post(productController.insertProducts);
// Create endpoint handlers for /updateProduct/:idProduct
apiRoutes.route('/updateProduct/:idProduct').post(productController.updateProduct);
// Create endpoint handlers for /deleteProduct/:idProduct
apiRoutes.route('/deleteProduct/:idProduct').post(productController.deleteProduct);

// Star the Server
app.listen(port);
console.log(clc.magenta('App listening on port %d'), port);
console.log(clc.magenta('Mode %s'), app.get('env'));
console.log(clc.magenta('Api Version: ' + pack.version));