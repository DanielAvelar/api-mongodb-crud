var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('info', {
        title: 'Hello - Welcome',
        message: 'Product control API'
    });
});

module.exports = router;