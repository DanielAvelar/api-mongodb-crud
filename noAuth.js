var connection = require('./configuration/connection');
const myCollection = "products";
// Database Name
const dbName = 'data-api';

// Select All Product for database.
exports.getProductsNoAuth = function (req, res) {
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
          res.json(listProducts);
        }
      );
    }
    client.close();
  });
};