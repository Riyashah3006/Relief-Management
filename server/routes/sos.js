const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// 1. Get All SOS Alerts (for GIS mapping and emergency center)
router.get('/', (req, res) => {
  const { status } = req.query;

  try {
    let sql = 'SELECT * FROM sos_alerts WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const alerts = db.prepare(sql).all(...params);
    return res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    console.error('Fetch SOS error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving SOS alerts.' });
  }
});

// 2. Trigger Emergency SOS Distress Alert (SCRUM-17)
router.post('/panic', (req, res) => {
  const { citizen_name, phone, latitude, longitude, location_name, message } = req.body;

  if (!citizen_name || !phone || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Name, contact phone, and GPS coordinates are mandatory for SOS distress dispatch.'
    });
  }

  try {
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const sosId = `SOS-${Date.now().toString().slice(-4)}-${randomHex}`;

    let citizenId = null;
    if (req.user && req.user.id) {
      citizenId = req.user.id;
    }

    db.prepare(`
      INSERT INTO sos_alerts (id, citizen_id, citizen_name, phone, latitude, longitude, location_name, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(
      sosId,
      citizenId,
      citizen_name,
      phone,
      parseFloat(latitude),
      parseFloat(longitude),
      location_name || 'Emergency Distress Beacon',
      message || 'Immediate emergency rescue assistance required!'
    );

    // Broadcast emergency notification to coordinators & authorities
    db.prepare(`
      INSERT INTO notifications (role_target, title, message, link)
      VALUES ('Coordinator', ?, ?, ?)
    `).run(
      `🚨 EMERGENCY SOS BEACON: ${sosId}`,
      `High-priority SOS from ${citizen_name} (${phone}) at ${location_name || 'GPS Point'}. Immediate rescue required!`,
      '/gis'
    );

    db.prepare(`
      INSERT INTO notifications (role_target, title, message, link)
      VALUES ('Authority', ?, ?, ?)
    `).run(
      `🚨 EMERGENCY SOS: ${sosId}`,
      `Distress call received from ${citizen_name} at coordinates [${latitude}, ${longitude}].`,
      '/gis'
    );

    logAudit(req, 'TRIGGER_SOS', `SOS:${sosId}`, `Emergency distress signal triggered at [${latitude}, ${longitude}]`);

    return res.status(201).json({
      success: true,
      message: 'EMERGENCY BEACON ACTIVE. Coordinates transmitted to Disaster Response Command.',
      sosId,
      status: 'Active'
    });
  } catch (err) {
    console.error('SOS trigger error:', err);
    return res.status(500).json({ success: false, message: 'Server error registering SOS alert.' });
  }
});

// 3. Respond / Resolve SOS Alert
router.patch('/:id/status', authenticateToken, requireRoles('Coordinator', 'Authority', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Active', 'Responded', 'Resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Active, Responded, or Resolved.' });
  }

  try {
    const responder = req.user.name || 'Coordinator Team';

    db.prepare(`
      UPDATE sos_alerts 
      SET status = ?, responded_by = ?
      WHERE id = ?
    `).run(status, responder, id);

    logAudit(req, 'UPDATE_SOS_STATUS', `SOS:${id}`, `SOS status updated to ${status} by ${responder}`);

    return res.json({ success: true, message: `SOS ${id} marked as ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating SOS status.' });
  }
});

module.exports = router;
