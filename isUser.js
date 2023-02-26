function isUser(req, res, next) {
    if (req.session.user)
        if (req.session.user.idToken.payload['custom:role'] == 'user') {

            return next();
        }
    res.redirect('/Login');
}

function isDesk1(req, res, next) {
    if (req.session.user)
        if (req.session.user.idToken.payload['custom:role'] != 'user') {
            return next();
        }
    res.redirect('/Login');
}

function isDesk2(req, res, next) {
    if (req.session.user)
        if (req.session.user.idToken.payload['custom:role'] == 'desk2') {
            return next();
        }
    res.redirect('/Login');
}

function isStaff(req, res, next) {
    if (req.session.user)
        if (req.session.user.idToken.payload['custom:role'] != 'user') {
            return next();
        }
    res.redirect('/Login');
}



module.exports = { isUser, isDesk1, isDesk2, isStaff };