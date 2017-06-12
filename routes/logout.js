var express = require('express');
var router = express.Router();

// Route logout user for system.
router.get('/logout', function(req, res) {
  req.session.destroy();
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.render('login', {
    title: 'Authenticate'
  });
});

module.exports = router;