var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('info', {
        title: 'Welcome',
        message: "Page dedicated to accessing the Product API's query, exclusion, and inclusion methods."
    });
});

module.exports = router;