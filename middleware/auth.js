// Blocks access unless the user is logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    req.session.flash = { type: 'warning', message: 'Please log in to continue.' };
    return res.redirect('/auth/login');
  }
  next();
}

// Makes user and cart info available in every EJS view (for navbar, badge, alerts)
function attachUser(req, res, next) {
  res.locals.userId = req.session.userId || null;
  res.locals.userName = req.session.userName || null;
  res.locals.userEmail = req.session.userEmail || null;

  const cart = req.session.cart || [];
  res.locals.cartCount = cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  res.locals.currentPath = req.path;
  next();
}

module.exports = { requireLogin, attachUser };
