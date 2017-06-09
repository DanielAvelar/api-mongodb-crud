var express = require('express');
var router = express.Router();
var conn = require('./connection');
var myCollection = "products";

/* GET Products No Auth. */
router.get('/getProductsNoAuth', function (req, res, next) {
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
});

module.exports = router;