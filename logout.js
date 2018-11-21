// Route logout user for system.
exports.getLogout = function(req, res) {
  req.session['x-access-token'] = null;
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.render('login', {
    title: 'Authenticate'
  });
};

