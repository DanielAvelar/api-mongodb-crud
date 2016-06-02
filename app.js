var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var clc = require('cli-color');
var MongoClient = require('mongodb').MongoClient;
var myCollection = "crud";
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./models/user'); // get our mongoose model
var dbHost = config.databaseApi;
var port = process.env.PORT || 54000; // used to create, sign, and verify tokens
var msg;

mongoose.connect(config.databaseUsers); // connect to database
app.set('superSecret', config.secret); // secret variable
app.set('view engine', 'jade');

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// use morgan to log requests to the console
app.use(morgan('dev'));

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'API_MONGO'
}));

// basic route (http://localhost:8080)
app.get('/', function(req, res) {
    res.render('info', {
        title: 'Hello',
        message: 'The API is at http://localhost:' + port + '/api'
    });
});

app.get('/login', function(req, res) {
    res.render('login', {
        title: 'Authenticate'
    });
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.render('login', {
        title: 'Login'
    });
});

// Select All book for database.
app.get('/getBooksNotAuth', function(req, res) {
    connection(req, res, function(err, db) {
        if (err) {
            formattingResponse(res, 503, 'error', 'Connection', err);
        } else {
            db.collection(myCollection).find({}, {}, {}).toArray(
                function(err, docs) {
                    var listBooks = [];
                    for (index in docs) {
                        listBooks.push(docs[index]);
                    }
                    res.json(listBooks);
                }
            );
        }
    });
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router();

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
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

// ---------------------------------------------------------
// Route Middleware to Authenticate and Check Token.
// ---------------------------------------------------------
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
// authenticated routes
// ---------------------------------------------------------
// Information API.
apiRoutes.get('/', function(req, res) {
    res.render('login', {
        title: 'Authenticate'
    });
});

apiRoutes.get('/logout', function(req, res) {
    req.session.destroy();
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.render('login', {
        title: 'Authenticate'
    });
});

apiRoutes.get('/createUser', function(req, res) {
    res.render('createUser', {
        title: 'Create Users'
    });
});

// =================================================================
// Route for create user.===========================================
// =================================================================
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

// Select All book for database.
apiRoutes.get('/getBooks', function(req, res) {
    connection(req, res, function(err, db) {
        if (err) {
            formattingResponse(res, 503, 'error', 'Connection', err);
        } else {
            db.collection(myCollection).find({}, {}, {}).toArray(
                function(err, docs) {
                    var listBooks = [];
                    for (index in docs) {
                        listBooks.push(docs[index]);
                    }
                    //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                    res.format({
                        //HTML response will render the index.jade file in the views folder. We are also setting "books" to be an accessible variable in our jade view
                        html: function() {
                            res.render('index', {
                                title: 'List of Books',
                                "books": listBooks
                            });
                        },
                        //JSON response will show all books in JSON format
                        json: function() {
                            res.json(listBooks);
                        }
                    });
                }
            );
        }
    });
});

// Select one book for database by isbn.
apiRoutes.get('/getOneBook/:isbn', function(req, res) {
    var isbn = req.params.isbn;
    var edit = req.query.edit === 'true' ? true : false;
    connection(req, res, function(err, db) {
        if (err) {
            formattingResponse(res, 503, 'error', 'Connection', err);
        } else {
            db.collection(myCollection).find({
                isbn: isbn
            }, {}, {}).toArray(
                function(err, docs) {
                    if (docs.length == 0) {
                        formattingResponse(res, 422, 'error', 'getOneBook', "Book with ISBN " + isbn + " not found");
                    } else {
                        if (edit) {
                            res.format({
                                //HTML response will render the 'edit.jade' template
                                html: function() {
                                    res.render('edit', {
                                        title: 'Edit Book',
                                        "book": docs[0]
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
                                        title: 'Show Book',
                                        "book": docs[0]
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

apiRoutes.get('/newBook', function(req, res) {
    res.render('insertBook', {
        title: 'Insert Book'
    });
});

// Insert one or more books in database.
apiRoutes.post('/insertBooks', function(req, res) {
    var listBooks = [];
    var countBooks = 0;
    var listIsbn = [];
    var lintCont;
    connection(req, res, function(err, db) {
        if (err) {
            formattingResponse(res, 503, 'error', 'Connection', err);
        } else {
            if (Object.prototype.toString.call(req.body) === '[object Array]') {
                countBooks = req.body.length;
                for (lintCont = 0; lintCont <= countBooks - 1; lintCont++) {
                    listIsbn.push(req.body[lintCont].isbn);
                }
                listBooks = req.body;
            } else {
                listBooks.push({
                    'name': req.body.name,
                    'isbn': req.body.isbn,
                    'author': req.body.author,
                    'pages': req.body.pages
                });
                listIsbn.push(req.body.isbn);
            }
            db.collection(myCollection).find({
                'isbn': {
                    '$in': listIsbn
                }
            }).toArray(
                function(err, docs) {
                    if (docs.length > 0) {
                        var result = docs.map(function(a) {
                            return a.isbn;
                        });
                        formattingResponse(res, 422, 'error', 'insertBooks', "Book(s) with ISBN " + result.join(', ') + " already exists.");
                    } else {
                        db.collection(myCollection).insert(listBooks, function(err, docs) {
                            if (err) {
                                formattingResponse(res, 503, 'error', 'Insert', err);
                            } else {
                                formattingResponse(res, 200, 'success', 'Insert', "Successfully inserted the book into database");
                            }
                        });
                    }
                }
            );
        }
    });
});

// Update a book in database.
apiRoutes.post('/updateBook/:isbn', function(req, res) {
    var bookName = req.body.name;
    var author = req.body.author;
    var pageCount = req.body.pages;
    var isbn = req.params.isbn;

    connection(req, res, function(err, db) {
        if (err) {
            formattingResponse(res, 503, 'error', 'Connection', err);
        } else {
            db.collection(myCollection).find({
                isbn: isbn
            }, {}, {}).toArray(
                function(err, docs) {
                    if (docs.length == 0) {
                        formattingResponse(res, 422, 'error', 'Update', "Book with ISBN " + isbn + " not found");
                    } else {
                        db.collection(myCollection).update({
                            "isbn": isbn
                        }, {
                            'name': bookName,
                            'author': author,
                            'pages': pageCount,
                            'isbn': isbn
                        }, function(err, docs) {
                            if (err) {
                                formattingResponse(res, 503, 'error', 'Update', err);
                            } else {
                                formattingResponse(res, 200, 'success', 'Update', "Successfully update the book into database");
                            }
                        });
                    }
                }
            );
        }
    });
});

// Delete a book in database.
apiRoutes.post('/deleteBook/:isbn', function(req, res) {
    var isbn = req.params.isbn;
    connection(req, res, function(err, db) {
        if (err) {
            formattingResponse(res, 503, 'error', 'Connection', err);
        } else {
            db.collection(myCollection).find({
                isbn: isbn
            }, {}, {}).toArray(
                function(err, docs) {
                    if (docs.length === 0) {
                        formattingResponse(res, 422, 'error', 'Delete', "Book with ISBN " + isbn + " not found");
                    } else {
                        db.collection(myCollection).remove({
                            isbn: docs[0].isbn
                        }, function(err, docs) {
                            if (err) {
                                formattingResponse(res, 503, 'error', 'Delete', err);
                            } else {
                                formattingResponse(res, 200, 'success', 'Delete', "Successfully deleted the book into database");
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

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', apiRoutes);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log(clc.cyanBright('Server running on: ') + clc.greenBright('http://localhost:' + port));