// Route logout user for system.
exports.getLogout = function(req, res) {
  req.session['x-access-token'] = null;
  res.render('login', {
    title: 'Authenticate'
  });
};

