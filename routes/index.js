var express = require('express');
var router = express.Router();
var port = process.env.PORT || 54000; // used to create, sign, and verify tokens

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('info', {
        title: 'Hello',
        message: 'The API is at http://localhost:' + port + '/api'
    });
});

module.exports = router;