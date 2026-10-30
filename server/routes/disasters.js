const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// 1. Get All Disasters (SCRUM-38: with filters by type, severity, status)
router.get('/', authenticateToken, (req, res) => {
  const { type, severity, status } = req.query;

  try {
    let sql = `
      SELECT d.*, 
        COUNT(r.id) as request_count,
        COALESCE(SUM(CASE WHEN r.status = 'Approved' THEN 1 ELSE 0 END), 0) as approved_count,
        COALESCE(SUM(CASE WHEN r.status = 'Submitted' THEN 1 ELSE 0 END), 0) as pending_count
      FROM disasters d
      LEFT JOIN relief_requests r ON r.disaster_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'All') {
      sql += ' AND LOWER(d.type) = LOWER(?)';
      params.push(type);
    }
    if (severity && severity !== 'All') {
      sql += ' AND LOWER(d.severity) = LOWER(?)';
      params.push(severity);
    }
    if (status && status !== 'All') {
      sql += ' AND LOWER(d.status) = LOWER(?)';
      params.push(status);
    }

    sql += ' GROUP BY d.id ORDER BY d.created_at DESC';

    const incidents = db.prepare(sql).all(...params);
    return res.json({ success: true, count: incidents.length, disasters: incidents });
  } catch (err) {
    console.error('Fetch disasters error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving disasters.' });
  }
});

// 2. Get Single Incident by ID (SCRUM-38 AC3)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    const disaster = db.prepare(`
      SELECT d.*, 
        COUNT(r.id) as request_count,
        COALESCE(SUM(r.people_affected), 0) as total_people_affected
      FROM disasters d
      LEFT JOIN relief_requests r ON r.disaster_id = d.id
      WHERE d.id = ?
      GROUP BY d.id
    `).get(id);

    if (!disaster) {
      return res.status(404).json({ success: false, message: `Disaster incident ${id} not found.` });
    }

    // Get related relief requests
    const requests = db.prepare(`
      SELECT * FROM relief_requests WHERE disaster_id = ? ORDER BY created_at DESC
    `).all(id);

    // Get related campaigns
    const campaigns = db.prepare(`
      SELECT * FROM donation_campaigns WHERE disaster_id = ?
    `).all(id);

    return res.json({
      success: true,
      disaster,
      requests,
      campaigns
    });
  } catch (err) {
    console.error('Fetch disaster detail error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving incident details.' });
  }
});

// 3. Create Disaster Incident (SCRUM-37) - Restricted to Authority & Admin
router.post('/', authenticateToken, requireRoles('Authority', 'Admin'), (req, res) => {
  const { title, type, severity, latitude, longitude, radius_km, affected_area, description } = req.body;

  // Validation (SCRUM-37 AC2)
  if (!title || !type || !severity || !affected_area || !description) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: Title, type, severity, affected area, and description are required.'
    });
  }

  const latNum = parseFloat(latitude) || 19.0760;
  const lngNum = parseFloat(longitude) || 72.8777;
  const radiusNum = parseFloat(radius_km) || 10;

  try {
    // Generate unique incident ID (SCRUM-37 AC1)
    const countRow = db.prepare('SELECT COUNT(*) as count FROM disasters').get();
    const nextNum = (countRow.count + 1).toString().padStart(3, '0');
    const incidentId = `DIS-${nextNum}`;

    const createdBy = req.user.name || 'Disaster Authority';

    db.prepare(`
      INSERT INTO disasters (id, title, type, severity, latitude, longitude, radius_km, affected_area, description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `).run(
      incidentId,
      title,
      type,
      severity,
      latNum,
      lngNum,
      radiusNum,
      affected_area,
      description,
      createdBy
    );

    // Trigger notification to all Relief Coordinators (SCRUM-37 AC3)
    db.prepare(`
      INSERT INTO notifications (role_target, title, message, link)
      VALUES ('Coordinator', ?, ?, ?)
    `).run(
      `New Incident: ${title} (${severity})`,
      `Authority ${createdBy} declared a ${severity} ${type} in ${affected_area}. Immediate response review requested.`,
      `/disasters/${incidentId}`
    );

    // Also notify citizens
    db.prepare(`
      INSERT INTO notifications (role_target, title, message, link)
      VALUES ('Citizen', ?, ?, ?)
    `).run(
      `Public Advisory: ${title}`,
      `A new disaster incident has been logged for ${affected_area}. Submit relief requests if affected.`,
      `/disasters/${incidentId}`
    );

    logAudit(req, 'CREATE_DISASTER', `Disaster:${incidentId}`, `Created incident ${incidentId}: ${title}`);

    const createdDisaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(incidentId);

    return res.status(201).json({
      success: true,
      message: `Disaster incident ${incidentId} created successfully. Relief coordinators notified.`,
      disaster: createdDisaster
    });
  } catch (err) {
    console.error('Create disaster error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating disaster incident.' });
  }
});

// 4. Update Disaster Status (e.g. Active -> Resolved)
router.patch('/:id/status', authenticateToken, requireRoles('Authority', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Active', 'Resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Active or Resolved.' });
  }

  try {
    db.prepare('UPDATE disasters SET status = ? WHERE id = ?').run(status, id);
    logAudit(req, 'UPDATE_DISASTER_STATUS', `Disaster:${id}`, `Status changed to ${status}`);
    return res.json({ success: true, message: `Disaster ${id} marked as ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating disaster status.' });
  }
});

module.exports = router;
