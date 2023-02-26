module.exports = function isLoggedIn(req, res, next) {
    if (req.session.user) {
        // console.log("User is logged in");
        // console.log(req.session.user);
        return next();
    }
    res.redirect('/Login');
}