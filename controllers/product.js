var formattingResponse = require('../configuration/formatting');
var connection = require('../configuration/connection');
var myCollection = "products";

// Select All Product for database.
exports.getProducts = function (req, res) {
  connection(req, res, function (err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({}, {}, {}).toArray(
        function (err, docs) {
          var listProducts = [];
          for (index in docs) {
            listProducts.push(docs[index]);
          }
          //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
          res.format({
            //HTML response will render the index.jade file in the views folder. We are also setting "Products" to be an accessible variable in our jade view
            html: function () {
              res.render('index', {
                title: 'List of Products',
                "products": listProducts
              });
            },
            //JSON response will show all Products in JSON format
            json: function () {
              res.json(listProducts);
            }
          });
        }
      );
    }
  });
};

// Select one Product for database by idProduct.
exports.getOneProduct = function (req, res) {
  var idProduct = req.params.idProduct;
  var edit = req.query.edit === 'true' ? true : false;
  connection(req, res, function (err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function (err, docs) {
          if (docs.length == 0) {
            formattingResponse(res, 422, 'error', 'getOneProduct', "Product with idProduct " + idProduct + " not found");
          } else {
            if (edit) {
              res.format({
                //HTML response will render the 'edit.jade' template
                html: function () {
                  res.render('edit', {
                    title: 'Edit Product',
                    "product": docs[0]
                  });
                },
                //JSON response will return the JSON output
                json: function () {
                  res.json(docs[0]);
                }
              });
            } else {
              res.format({
                //HTML response will render the 'show.jade' template
                html: function () {
                  res.render('show', {
                    title: 'Show Product',
                    "product": docs[0]
                  });
                },
                //JSON response will return the JSON output
                json: function () {
                  res.json(docs[0]);
                }
              });
            }
          }
        }
      );
    }
  });
};

// Route new Product.
exports.newProduct = function (req, res) {
  res.render('insertProduct', {
    title: 'Insert Product',
    message_erro: ''
  });
};

// Insert one or more Products in mongodb.
exports.insertProducts = function(req, res){
  var listProducts = [];
  var countProducts = 0;
  var listidProduct = [];
  var lintCont;

  connection(req, res, function (err, db) {
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
        function (err, docs) {
          if (docs.length > 0) {
            var result = docs.map(function (a) {
              return a.idProduct;
            });
            formattingResponse(res, 422, 'error', 'insertProducts', "Product(s) with idProduct " + result.join(', ') + " already exists.");
          } else {
            db.collection(myCollection).insert(listProducts, function (err, docs) {
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
}

// Update a Product in mongodb.
exports.updateProduct = function(req, res){
  var ProductName = req.body.name;
  var description = req.body.description;
  var amount = req.body.amount;
  var category = req.body.category;
  var price = req.body.price;
  var urlImage = req.body.urlImage;
  var idProduct = req.params.idProduct;

  connection(req, res, function (err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function (err, docs) {
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
              'price': price,
              'urlImage': urlImage
            }, function (err, docs) {
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
}

// Delete a Product in mongodb.
exports.deleteProduct = function(req, res){
  var idProduct = req.params.idProduct;
  connection(req, res, function (err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function (err, docs) {
          if (docs.length === 0) {
            formattingResponse(res, 422, 'error', 'Delete', "Product with idProduct " + idProduct + " not found");
          } else {
            db.collection(myCollection).remove({
              idProduct: docs[0].idProduct
            }, function (err, docs) {
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
}