const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// All routes here strictly enforce SCRUM-36: Only Admin can access
router.use(authenticateToken);
router.use(requireRoles('Admin'));

// 1. Get All Users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, phone, role, location, failed_attempts, locked_until, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
});

// 2. Update User Role
router.patch('/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['Citizen', 'Coordinator', 'Volunteer', 'Donor', 'Authority', 'Admin'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${validRoles.join(', ')}`
    });
  }

  try {
    const targetUser = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: `User ${id} not found.` });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

    logAudit(req, 'UPDATE_USER_ROLE', `User:${id}`, `Role changed from ${targetUser.role} to ${role}`);

    return res.json({
      success: true,
      message: `User ${targetUser.email} role updated to ${role}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating user role.' });
  }
});

// 3. Unlock Account
router.post('/users/:id/unlock', (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(id);
    logAudit(req, 'UNLOCK_USER_ACCOUNT', `User:${id}`, 'Manual account unlock by administrator');

    return res.json({ success: true, message: `User ${id} account unlocked successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error unlocking user account.' });
  }
});

// 4. Get System Audit Trail (SCRUM-32)
router.get('/audit-logs', (req, res) => {
  const { action, limit } = req.query;

  try {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (action && action !== 'All') {
      sql += ' AND action = ?';
      params.push(action);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 100);

    const logs = db.prepare(sql).all(...params);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving audit logs.' });
  }
});

// 5. System Health Check
router.get('/health', (req, res) => {
  try {
    const dbCheck = db.prepare('SELECT 1 as healthy').get();
    return res.json({
      success: true,
      status: 'OPERATIONAL',
      platform: 'Vanguard Ops Relief Management System',
      database: dbCheck.healthy === 1 ? 'Connected (node:sqlite)' : 'Degraded',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, status: 'ERROR', error: err.message });
  }
});

module.exports = router;
