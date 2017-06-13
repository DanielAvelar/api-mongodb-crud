/* Login home page. */
exports.getLogin = function (req, res, next) {
    res.render('login', {
        title: 'Authenticate of User'
    });
};