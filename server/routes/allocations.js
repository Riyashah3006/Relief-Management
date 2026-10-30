const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// 1. Get All Allocations
router.get('/', authenticateToken, requireRoles('Coordinator', 'Volunteer', 'Authority', 'Admin'), (req, res) => {
  const { status, request_id } = req.query;

  try {
    let sql = `
      SELECT a.*, r.citizen_name, r.address, r.urgency, u.name as volunteer_name, u.phone as volunteer_phone
      FROM allocations a
      JOIN relief_requests r ON r.id = a.request_id
      LEFT JOIN volunteers v ON v.id = a.volunteer_id
      LEFT JOIN users u ON u.id = v.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (request_id) {
      sql += ' AND a.request_id = ?';
      params.push(request_id);
    }

    sql += ' ORDER BY a.allocated_at DESC';

    const allocations = db.prepare(sql).all(...params);
    return res.json({ success: true, count: allocations.length, allocations });
  } catch (err) {
    console.error('Fetch allocations error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving allocations.' });
  }
});

// 2. Create Allocation (Allocate Resource to Approved Request)
router.post('/', authenticateToken, requireRoles('Coordinator', 'Admin'), (req, res) => {
  const { request_id, resource_id, quantity, volunteer_id } = req.body;

  if (!request_id || !resource_id || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Request ID, resource ID, and quantity to allocate are required.'
    });
  }

  const allocQty = parseInt(quantity, 10);
  if (allocQty <= 0) {
    return res.status(400).json({ success: false, message: 'Allocation quantity must be greater than zero.' });
  }

  try {
    const request = db.prepare('SELECT * FROM relief_requests WHERE id = ?').get(request_id);
    if (!request) {
      return res.status(404).json({ success: false, message: `Request ${request_id} not found.` });
    }

    const resource = db.prepare('SELECT * FROM resources_inventory WHERE id = ?').get(resource_id);
    if (!resource) {
      return res.status(404).json({ success: false, message: `Resource ${resource_id} not found.` });
    }

    // Verify stock availability
    if (resource.quantity < allocQty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory. Available stock for ${resource.item_name} is only ${resource.quantity} ${resource.unit}.`
      });
    }

    // Deduct stock
    db.prepare('UPDATE resources_inventory SET quantity = quantity - ? WHERE id = ?').run(allocQty, resource_id);

    // Insert allocation record
    const insertStmt = db.prepare(`
      INSERT INTO allocations (request_id, resource_id, item_name, quantity_allocated, status, volunteer_id)
      VALUES (?, ?, ?, ?, 'Allocated', ?)
    `);
    const allocInfo = insertStmt.run(request_id, resource_id, resource.item_name, allocQty, volunteer_id || null);

    // If volunteer assigned, create volunteer mission task
    if (volunteer_id) {
      db.prepare(`
        INSERT INTO volunteer_tasks (volunteer_id, request_id, title, description, location, status)
        VALUES (?, ?, ?, ?, ?, 'Assigned')
      `).run(
        volunteer_id,
        request_id,
        `Deliver ${allocQty} ${resource.unit} of ${resource.item_name}`,
        `Deliver allocated supplies to ${request.citizen_name} (${request.citizen_phone}) at ${request.address}`,
        request.address
      );
    }

    // Notify citizen
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, link)
      VALUES (?, 'Citizen', ?, ?, ?)
    `).run(
      request.citizen_id,
      `Supplies Allocated: ${request_id}`,
      `${allocQty} ${resource.unit} of ${resource.item_name} has been allocated and is preparing for dispatch.`,
      '/citizen'
    );

    logAudit(req, 'CREATE_ALLOCATION', `Allocation:${allocInfo.lastInsertRowid}`, `Allocated ${allocQty} ${resource.item_name} to ${request_id}`);

    return res.status(201).json({
      success: true,
      message: `Successfully allocated ${allocQty} ${resource.unit} of ${resource.item_name}.`,
      allocationId: allocInfo.lastInsertRowid
    });
  } catch (err) {
    console.error('Create allocation error:', err);
    return res.status(500).json({ success: false, message: 'Server error during allocation.' });
  }
});

// 3. Update Delivery Status (SCRUM-26: Dispatched, In Transit, Delivered)
router.patch('/:id/status', authenticateToken, requireRoles('Coordinator', 'Volunteer', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['Allocated', 'Dispatched', 'In Transit', 'Delivered'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const allocation = db.prepare('SELECT * FROM allocations WHERE id = ?').get(id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: `Allocation ${id} not found.` });
    }

    const deliveredAt = status === 'Delivered' ? new Date().toISOString() : allocation.delivered_at;

    db.prepare(`
      UPDATE allocations 
      SET status = ?, delivered_at = ?
      WHERE id = ?
    `).run(status, deliveredAt, id);

    // If delivered, update associated volunteer task if present
    if (status === 'Delivered' && allocation.volunteer_id) {
      db.prepare(`
        UPDATE volunteer_tasks 
        SET status = 'Completed', proof_notes = ?, completed_at = datetime('now')
        WHERE volunteer_id = ? AND request_id = ?
      `).run(notes || 'Delivery confirmed on ground.', allocation.volunteer_id, allocation.request_id);

      // Increment volunteer tasks_completed
      db.prepare('UPDATE volunteers SET tasks_completed = tasks_completed + 1 WHERE id = ?').run(allocation.volunteer_id);

      // Update relief request status to Completed
      db.prepare(`
        UPDATE relief_requests 
        SET status = 'Completed', updated_at = datetime('now')
        WHERE id = ?
      `).run(allocation.request_id);
    }

    logAudit(req, 'UPDATE_ALLOCATION_STATUS', `Allocation:${id}`, `Status updated to ${status}`);

    return res.json({
      success: true,
      message: `Allocation status updated to '${status}'.`
    });
  } catch (err) {
    console.error('Update allocation status error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating allocation status.' });
  }
});

module.exports = router;
