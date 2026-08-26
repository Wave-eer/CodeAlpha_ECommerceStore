// Blocks access unless the user is logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
}

// Makes user info available in every EJS view (for navbar etc.)
function attachUser(req, res, next) {
  res.locals.userId = req.session.userId || null;
  res.locals.userName = req.session.userName || null;
  next();
}

module.exports = { requireLogin, attachUser };
