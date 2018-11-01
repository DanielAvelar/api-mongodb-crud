var formattingResponse = require('../configuration/formatting');
var connection = require('../configuration/connection');
const myCollection = "products";
// Database Name
const dbName = 'data-api';

// Select All Product for database.
exports.getProducts = function (req, res) {
  connection(req, res, function (err, client) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      const db = client.db(dbName);
      // Get the documents collection
      const collection = db.collection(myCollection);
      collection.find({}).toArray(
        function (err, docs) {
          var listProducts = [];
          for (index in docs) {
            listProducts.push(docs[index]);
          }

          if (req.query.retornoJson === "true") {
            res.send({
              products: listProducts
            })
          } else {
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
        }
      );
    }
    client.close();
  });
};

// Select one Product for database by idProduct.
exports.getOneProduct = function (req, res) {
  var idProduct = req.params.idProduct;
  var edit = req.query.edit === 'true' ? true : false;
  connection(req, res, function (err, client) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err, req.query.retornoJson);
    } else {
      const db = client.db(dbName);
      // Get the documents collection
      const collection = db.collection(myCollection);
      collection.find({
        idProduct: idProduct
      }).toArray(
        function (err, docs) {
          if (docs.length == 0) {
            formattingResponse(res, 422, 'error', 'getOneProduct', "Product with idProduct " + idProduct + " not found", req.query.retornoJson);
          } else {
            if (edit) {
              if (req.query.retornoJson === "true") {
                res.send({
                  product: docs[0]
                })
              } else {
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
              }
            } else {
              if (req.query.retornoJson === "true") {
                res.send({
                  product: docs[0]
                })
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
        }
      );
    }
    client.close();
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
exports.insertProducts = function (req, res) {
  var listProducts = [];
  var listidProduct = [];

  connection(req, res, function (err, client) {
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
      const db = client.db(dbName);
      // Get the documents collection
      const collection = db.collection(myCollection);
      collection.find({
        'idProduct': {
          '$in': listidProduct
        }
      }).toArray(
        function (err, docs) {
          if (docs.length > 0) {
            var result = docs.map(function (a) {
              return a.idProduct;
            });
            formattingResponse(res, 422, 'error', 'insertProducts', "Product(s) with idProduct " + result.join(', ') + " already exists.", req.query.retornoJson);
          } else {
            collection.insert(listProducts, function (err, docs) {
              if (err) {
                formattingResponse(res, 503, 'error', 'Insert', err, req.query.retornoJson);
              } else {
                formattingResponse(res, 200, 'success', 'Insert', "Successfully inserted the Product into database", req.query.retornoJson);
              }
            });
          }
        }
      );
    }
  });
}

// Update a Product in mongodb.
exports.updateProduct = function (req, res) {
  var ProductName = req.body.name;
  var description = req.body.description;
  var amount = req.body.amount;
  var category = req.body.category;
  var price = req.body.price;
  var urlImage = req.body.urlImage;
  var idProduct = req.params.idProduct;

  connection(req, res, function (err, client) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err, req.query.retornoJson);
    } else {
      const db = client.db(dbName);
      // Get the documents collection
      const collection = db.collection(myCollection);
      collection.find({
        idProduct: idProduct
      }, {}, {}).toArray(
        function (err, docs) {
          if (docs.length == 0) {
            formattingResponse(res, 422, 'error', 'Update', "Product with idProduct " + idProduct + " not found", req.query.retornoJson);
          } else {
            // Get the documents collection
            collection.update({
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
                formattingResponse(res, 503, 'error', 'Update', err, req.query.retornoJson);
              } else {
                client.close();
                formattingResponse(res, 200, 'success', 'Update', "Successfully update the Product into database", req.query.retornoJson);
              }
            });
          }
        }
      );
    }
  });
}

// Delete a Product in mongodb.
exports.deleteProduct = function (req, res) {
  var idProduct = req.params.idProduct;
  connection(req, res, function (err, client) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      const db = client.db(dbName);
      // Get the documents collection
      const collection = db.collection(myCollection);
      collection.find({
        idProduct: idProduct
      }).toArray(
        function (err, docs) {
          if (docs.length === 0) {
            formattingResponse(res, 422, 'error', 'Delete', "Product with idProduct " + idProduct + " not found", req.query.retornoJson);
          } else {
            collection.deleteOne({
              idProduct: docs[0].idProduct
            }, function (err, docs) {
              if (err) {
                formattingResponse(res, 503, 'error', 'Delete', err, req.query.retornoJson);
              } else {
                client.close();
                formattingResponse(res, 200, 'success', 'Delete', "Successfully deleted the Product into database", req.query.retornoJson);
              }
            });
          }
        }
      );
    }
  });
}