const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// 1. Submit Relief Request (SCRUM-39) - Citizen
router.post('/', authenticateToken, (req, res) => {
  const { disaster_id, request_type, urgency, people_affected, address, description, latitude, longitude } = req.body;

  // Validation: mandatory fields check (SCRUM-39 AC3)
  if (!disaster_id || !request_type || !urgency || !address) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: Disaster selection, request type, urgency level, and address/location are required.'
    });
  }

  const validTypes = ['Food', 'Shelter', 'Medical', 'Clothing', 'Rescue', 'Other'];
  if (!validTypes.includes(request_type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid request type. Must be one of: ${validTypes.join(', ')}`
    });
  }

  const validUrgency = ['Critical', 'High', 'Medium', 'Low'];
  if (!validUrgency.includes(urgency)) {
    return res.status(400).json({
      success: false,
      message: `Invalid urgency level. Must be one of: ${validUrgency.join(', ')}`
    });
  }

  try {
    // Generate unique Request ID (SCRUM-39 AC1)
    const countRow = db.prepare('SELECT COUNT(*) as count FROM relief_requests').get();
    const requestId = `REQ-${(1001 + countRow.count)}`;

    const peopleCount = parseInt(people_affected, 10) || 1;
    const lat = parseFloat(latitude) || null;
    const lng = parseFloat(longitude) || null;

    db.prepare(`
      INSERT INTO relief_requests (
        id, citizen_id, citizen_name, citizen_phone, disaster_id, request_type, 
        urgency, people_affected, latitude, longitude, address, description, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `).run(
      requestId,
      req.user.id,
      req.user.name,
      req.user.phone || '',
      disaster_id,
      request_type,
      urgency,
      peopleCount,
      lat,
      lng,
      address,
      description || ''
    );

    // Send confirmation notification to citizen with Request ID (SCRUM-39 AC2)
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, link)
      VALUES (?, 'Citizen', ?, ?, ?)
    `).run(
      req.user.id,
      `Relief Request Submitted: ${requestId}`,
      `Your request for ${request_type} assistance has been successfully registered under ${requestId}. Relief coordinators will review it promptly.`,
      '/citizen'
    );

    // Alert Coordinators about new submitted request
    db.prepare(`
      INSERT INTO notifications (role_target, title, message, link)
      VALUES ('Coordinator', ?, ?, ?)
    `).run(
      `New Relief Request: ${requestId} (${urgency})`,
      `${req.user.name} submitted a ${urgency} priority request for ${request_type} at ${address}.`,
      '/coordinator'
    );

    logAudit(req, 'SUBMIT_REQUEST', `Request:${requestId}`, `Submitted request for ${request_type} (${urgency})`);

    const created = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(requestId);

    return res.status(201).json({
      success: true,
      message: `Relief request ${requestId} submitted successfully.`,
      requestId,
      request: created
    });
  } catch (err) {
    console.error('Submit request error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating relief request.' });
  }
});

// 2. View My Relief Requests (SCRUM-40) - For logged-in Citizen
router.get('/my', authenticateToken, (req, res) => {
  const { status } = req.query;

  try {
    let sql = `
      SELECT r.*, d.title as disaster_title, d.severity as disaster_severity
      FROM relief_requests r
      LEFT JOIN disasters d ON d.id = r.disaster_id
      WHERE r.citizen_id = ?
    `;
    const params = [req.user.id];

    // Filter by status (SCRUM-40 AC2)
    if (status && status !== 'All') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const requests = db.prepare(sql).all(...params);

    // Attach allocations if any
    const requestsWithDetails = requests.map(reqItem => {
      const allocations = db.prepare(`
        SELECT a.*, v.skills, u.name as volunteer_name, u.phone as volunteer_phone
        FROM allocations a
        LEFT JOIN volunteers v ON v.id = a.volunteer_id
        LEFT JOIN users u ON u.id = v.user_id
        WHERE a.request_id = ?
      `).all(reqItem.id);
      return { ...reqItem, allocations };
    });

    return res.json({
      success: true,
      count: requestsWithDetails.length,
      requests: requestsWithDetails
    });
  } catch (err) {
    console.error('Fetch my requests error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving citizen requests.' });
  }
});

// 3. Coordinator Queue: Review and Prioritize Relief Requests (SCRUM-41)
router.get('/coordinator/queue', authenticateToken, requireRoles('Coordinator', 'Authority', 'Admin'), (req, res) => {
  const { status, disaster_id, urgency, priority } = req.query;

  try {
    let sql = `
      SELECT r.*, d.title as disaster_title, u.phone as citizen_phone_record
      FROM relief_requests r
      LEFT JOIN disasters d ON d.id = r.disaster_id
      LEFT JOIN users u ON u.id = r.citizen_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (disaster_id && disaster_id !== 'All') {
      sql += ' AND r.disaster_id = ?';
      params.push(disaster_id);
    }
    if (urgency && urgency !== 'All') {
      sql += ' AND r.urgency = ?';
      params.push(urgency);
    }
    if (priority && priority !== 'All') {
      sql += ' AND r.priority = ?';
      params.push(priority);
    }

    // Default sorting by urgency weight and submission time (SCRUM-41 AC3)
    sql += `
      ORDER BY 
        CASE r.urgency
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
          ELSE 5
        END ASC,
        r.created_at ASC
    `;

    const queue = db.prepare(sql).all(...params);

    const fullQueue = queue.map(item => {
      const allocations = db.prepare('SELECT * FROM allocations WHERE request_id = ?').all(item.id);
      return { ...item, allocations };
    });

    return res.json({ success: true, count: fullQueue.length, requests: fullQueue });
  } catch (err) {
    console.error('Fetch coordinator queue error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving coordinator queue.' });
  }
});

// 4. Prioritize Request (SCRUM-41 AC2: set priority -> status changes to "Under Review")
router.patch('/:id/prioritize', authenticateToken, requireRoles('Coordinator', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { priority, coordinator_notes } = req.body;

  const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
  if (!priority || !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Priority must be one of: ${validPriorities.join(', ')}`
    });
  }

  try {
    const existing = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Request ${id} not found.` });
    }

    // Update status to 'Under Review' and save priority (SCRUM-41 AC2)
    db.prepare(`
      UPDATE relief_requests 
      SET priority = ?, status = 'Under Review', coordinator_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(priority, coordinator_notes || existing.coordinator_notes, id);

    logAudit(req, 'PRIORITIZE_REQUEST', `Request:${id}`, `Assigned priority: ${priority}, status: Under Review`);

    // Notify citizen
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, link)
      VALUES (?, 'Citizen', ?, ?, ?)
    `).run(
      existing.citizen_id,
      `Request ${id} Under Review`,
      `Your request has been triaged by a coordinator and prioritized as ${priority}.`,
      '/citizen'
    );

    const updated = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(id);
    return res.json({
      success: true,
      message: `Request ${id} priority set to ${priority} and moved to 'Under Review'.`,
      request: updated
    });
  } catch (err) {
    console.error('Prioritize error:', err);
    return res.status(500).json({ success: false, message: 'Server error prioritizing request.' });
  }
});

// 5. Approve Request (SCRUM-42 AC1 & AC3: approve with comments -> status 'Approved' -> pushes to Resource Allocation queue)
router.post('/:id/approve', authenticateToken, requireRoles('Coordinator', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Request ${id} not found.` });
    }

    db.prepare(`
      UPDATE relief_requests 
      SET status = 'Approved', coordinator_notes = COALESCE(?, coordinator_notes), updated_at = datetime('now')
      WHERE id = ?
    `).run(comments || null, id);

    // Notify citizen (SCRUM-42 AC1)
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, link)
      VALUES (?, 'Citizen', ?, ?, ?)
    `).run(
      existing.citizen_id,
      `Relief Request Approved: ${id}`,
      `Your request ${id} has been Approved! Resources are being queued for dispatch. Comments: ${comments || 'None'}`,
      '/citizen'
    );

    logAudit(req, 'APPROVE_REQUEST', `Request:${id}`, `Approved request with comment: ${comments || 'None'}`);

    const updated = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(id);
    return res.json({
      success: true,
      message: `Request ${id} has been Approved and moved to the Resource Allocation queue.`,
      request: updated
    });
  } catch (err) {
    console.error('Approve request error:', err);
    return res.status(500).json({ success: false, message: 'Server error approving request.' });
  }
});

// 6. Reject Request (SCRUM-42 AC2: reject with mandatory reason -> status 'Rejected' + notification)
router.post('/:id/reject', authenticateToken, requireRoles('Coordinator', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  // Mandatory rejection reason (SCRUM-42 AC2)
  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Mandatory rejection reason must be provided.'
    });
  }

  try {
    const existing = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Request ${id} not found.` });
    }

    db.prepare(`
      UPDATE relief_requests 
      SET status = 'Rejected', rejection_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(rejection_reason.trim(), id);

    // Notify citizen with the reason (SCRUM-42 AC2)
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, link)
      VALUES (?, 'Citizen', ?, ?, ?)
    `).run(
      existing.citizen_id,
      `Relief Request Rejected: ${id}`,
      `Your request ${id} was not approved. Reason: ${rejection_reason.trim()}`,
      '/citizen'
    );

    logAudit(req, 'REJECT_REQUEST', `Request:${id}`, `Rejected request. Reason: ${rejection_reason.trim()}`);

    const updated = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(id);
    return res.json({
      success: true,
      message: `Request ${id} rejected with mandatory reason documented.`,
      request: updated
    });
  } catch (err) {
    console.error('Reject request error:', err);
    return res.status(500).json({ success: false, message: 'Server error rejecting request.' });
  }
});

// 7. Get Request Detail by ID (SCRUM-40 AC3)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    const request = db.prepare(`
      SELECT r.*, d.title as disaster_title, d.severity as disaster_severity, d.affected_area
      FROM relief_requests r
      LEFT JOIN disasters d ON d.id = r.disaster_id
      WHERE r.id = ?
    `).get(id);

    if (!request) {
      return res.status(404).json({ success: false, message: `Request ${id} not found.` });
    }

    // Role check: Citizen can only view their own requests, unless Coordinator/Authority/Admin
    if (req.user.role === 'Citizen' && request.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this request.' });
    }

    const allocations = db.prepare(`
      SELECT a.*, v.skills, u.name as volunteer_name, u.phone as volunteer_phone
      FROM allocations a
      LEFT JOIN volunteers v ON v.id = a.volunteer_id
      LEFT JOIN users u ON u.id = v.user_id
      WHERE a.request_id = ?
    `).all(id);

    return res.json({ success: true, request, allocations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving request details.' });
  }
});

module.exports = router;
