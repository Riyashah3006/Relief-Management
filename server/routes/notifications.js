const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 1. Get Notifications for current user and role
router.get('/', authenticateToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? OR role_target = ? OR (user_id IS NULL AND role_target IS NULL)
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id, req.user.role);

    const unreadCount = notifications.filter(n => n.read_status === 0).length;

    return res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
});

// 2. Mark Single Notification as Read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('UPDATE notifications SET read_status = 1 WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
});

// 3. Mark All Notifications as Read
router.patch('/read-all', authenticateToken, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications 
      SET read_status = 1 
      WHERE user_id = ? OR role_target = ?
    `).run(req.user.id, req.user.role);

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
});

module.exports = router;
