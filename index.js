
/* GET home page. */
exports.getIndex = function(req, res, next) {
  res.render('info', {
        title: 'Welcome',
        message: "Page dedicated to accessing the Product API's query, exclusion, and inclusion methods."
    });
};