const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Show register form
router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register', { error: null, values: {} });
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      return res.render('register', {
        error: 'All fields are required.',
        values: { name: trimmedName, email: trimmedEmail }
      });
    }

    if (password.length < 6) {
      return res.render('register', {
        error: 'Password must be at least 6 characters long.',
        values: { name: trimmedName, email: trimmedEmail }
      });
    }

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.render('register', {
        error: 'An account with this email already exists. Please log in.',
        values: { name: trimmedName, email: trimmedEmail }
      });
    }

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: password
    });

    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.flash = {
      type: 'success',
      message: 'Welcome to Halo Market, ' + user.name + '! Your account is ready.'
    };

    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', {
      error: 'Registration failed. Please try again.',
      values: req.body || {}
    });
  }
});

// Show login form
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { error: null, email: '' });
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return res.render('login', {
        error: 'Please enter both your email and password.',
        email: trimmedEmail
      });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.render('login', {
        error: 'No account found with that email address.',
        email: trimmedEmail
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', {
        error: 'Incorrect password. Please try again.',
        email: trimmedEmail
      });
    }

    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.flash = {
      type: 'success',
      message: 'Welcome back, ' + user.name + '!'
    };

    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', {
      error: 'An unexpected error occurred during login. Please try again.',
      email: req.body.email || ''
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout session destroy error:', err);
    res.redirect('/?loggedOut=true');
  });
});

module.exports = router;
