const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getData, saveData } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const AVATAR_COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0284c7', '#db2777'];

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const db = getData();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    password: passwordHash,
    avatarBg: randomColor,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveData(db);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    token,
    user: userWithoutPassword
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getData();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const db = getData();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// GET /api/users - Search users for adding members to projects
router.get('/users', authenticateToken, (req, res) => {
  const db = getData();
  const query = (req.query.q || '').toLowerCase();

  const users = db.users
    .filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarBg: u.avatarBg
    }));

  res.json(users);
});

module.exports = router;
