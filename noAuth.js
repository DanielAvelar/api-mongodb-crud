var conn = require('./configuration/connection');
var myCollection = "products";

/* GET Products No Auth. */
exports.getProductsNoAuth = function (req, res, next) {
    conn(req, res, function(err, db) {
    if (err) {
      formattingResponse(res, 503, 'error', 'Connection', err);
    } else {
      db.collection(myCollection).find({}, {}, {}).toArray(
        function(err, docs) {
          var listProducts = [];
          for (index in docs) {
            listProducts.push(docs[index]);
          }
          res.json(listProducts);
        }
      );
    }
  });
};