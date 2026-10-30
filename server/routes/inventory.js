const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// 1. Get Inventory Items (with low stock flagging)
router.get('/', authenticateToken, (req, res) => {
  const { category, low_stock } = req.query;

  try {
    let sql = `
      SELECT *,
        CASE WHEN quantity <= min_threshold THEN 1 ELSE 0 END as is_low_stock
      FROM resources_inventory
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (low_stock === 'true') {
      sql += ' AND quantity <= min_threshold';
    }

    sql += ' ORDER BY category, item_name';

    const items = db.prepare(sql).all(...params);
    return res.json({ success: true, count: items.length, items });
  } catch (err) {
    console.error('Fetch inventory error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving inventory.' });
  }
});

// 2. Add New Resource Item
router.post('/', authenticateToken, requireRoles('Coordinator', 'Authority', 'Admin'), (req, res) => {
  const { item_name, category, quantity, unit, warehouse_location, min_threshold } = req.body;

  if (!item_name || !category || !unit || !warehouse_location) {
    return res.status(400).json({
      success: false,
      message: 'Item name, category, unit, and warehouse location are required.'
    });
  }

  const qty = parseInt(quantity, 10) || 0;
  const threshold = parseInt(min_threshold, 10) || 50;

  try {
    const info = db.prepare(`
      INSERT INTO resources_inventory (item_name, category, quantity, unit, warehouse_location, min_threshold)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(item_name, category, qty, unit, warehouse_location, threshold);

    logAudit(req, 'ADD_INVENTORY', `Resource:${info.lastInsertRowid}`, `Added ${item_name} (${qty} ${unit})`);

    const created = db.prepare('SELECT * FROM resources_inventory WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Resource added successfully.', item: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error adding resource.' });
  }
});

// 3. Update Resource Stock / Warehouse
router.patch('/:id', authenticateToken, requireRoles('Coordinator', 'Authority', 'Admin'), (req, res) => {
  const { id } = req.params;
  const { quantity, warehouse_location, min_threshold } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM resources_inventory WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Resource ${id} not found.` });
    }

    const updatedQty = quantity !== undefined ? parseInt(quantity, 10) : existing.quantity;
    const updatedLocation = warehouse_location || existing.warehouse_location;
    const updatedThreshold = min_threshold !== undefined ? parseInt(min_threshold, 10) : existing.min_threshold;

    db.prepare(`
      UPDATE resources_inventory 
      SET quantity = ?, warehouse_location = ?, min_threshold = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updatedQty, updatedLocation, updatedThreshold, id);

    logAudit(req, 'UPDATE_INVENTORY', `Resource:${id}`, `Updated stock: ${updatedQty} at ${updatedLocation}`);

    const updated = db.prepare('SELECT * FROM resources_inventory WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Resource stock updated successfully.', item: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating resource.' });
  }
});

module.exports = router;
