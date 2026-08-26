const express = require('express');
const router = express.Router();
const { getData, saveData } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  const db = getData();
  const userId = req.user.id;

  const userNotifs = db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(userNotifs);
});

// PUT /api/notifications/read - Mark notifications read
router.put('/read', authenticateToken, (req, res) => {
  const db = getData();
  const userId = req.user.id;
  const { id } = req.body; // if id omitted, mark all as read

  db.notifications.forEach(n => {
    if (n.userId === userId) {
      if (!id || n.id === id) {
        n.read = true;
      }
    }
  });

  saveData(db);
  res.json({ message: 'Notifications marked as read' });
});

module.exports = router;
