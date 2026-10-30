const express = require('express');
const router = express.Router();
const crypto = require('node:crypto');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// 1. Get All Donation Campaigns
router.get('/campaigns', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT c.*, d.title as disaster_title, d.severity as disaster_severity
      FROM donation_campaigns c
      LEFT JOIN disasters d ON d.id = c.disaster_id
      ORDER BY c.created_at DESC
    `).all();

    return res.json({ success: true, count: campaigns.length, campaigns });
  } catch (err) {
    console.error('Fetch campaigns error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving campaigns.' });
  }
});

// 2. Submit a Donation (Monetary or Supplies)
router.post('/', (req, res) => {
  const { donor_name, donor_email, amount, type, item_details, campaign_title, payment_method } = req.body;

  if (!donor_name || !donor_email || !campaign_title) {
    return res.status(400).json({
      success: false,
      message: 'Donor name, email, and campaign title are required.'
    });
  }

  const donationType = type || 'Monetary';
  const numAmount = donationType === 'Monetary' ? (parseFloat(amount) || 0) : 0;

  if (donationType === 'Monetary' && numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid donation amount.' });
  }

  if (donationType === 'Supplies' && (!item_details || !item_details.trim())) {
    return res.status(400).json({ success: false, message: 'Please describe the relief supplies being donated.' });
  }

  try {
    // Generate unique receipt number and transaction reference
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const receiptNumber = `RCP-2026-${randomHex}`;
    const paymentRef = `TXN_${donationType === 'Monetary' ? 'PAY' : 'SUP'}_${Date.now().toString().slice(-8)}`;

    let donorId = null;
    if (req.user && req.user.id) {
      donorId = req.user.id;
    }

    db.prepare(`
      INSERT INTO donations (
        donor_name, donor_email, donor_id, type, amount, item_details, 
        campaign_title, payment_method, payment_ref, receipt_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      donor_name,
      donor_email,
      donorId,
      donationType,
      numAmount,
      item_details || null,
      campaign_title,
      payment_method || 'UPI / Card',
      paymentRef,
      receiptNumber
    );

    // Update campaign raised amount if monetary
    if (donationType === 'Monetary' && numAmount > 0) {
      db.prepare(`
        UPDATE donation_campaigns 
        SET raised_amount = raised_amount + ? 
        WHERE title = ?
      `).run(numAmount, campaign_title);
    }

    // Insert notification
    if (donorId) {
      db.prepare(`
        INSERT INTO notifications (user_id, role_target, title, message, link)
        VALUES (?, 'Donor', 'Donation Receipt Generated', ?, '/donor')
      `).run(donorId, `Thank you! Receipt ${receiptNumber} for your ${donationType} donation has been issued.`);
    }

    logAudit(req, 'DONATION_RECEIVED', `Receipt:${receiptNumber}`, `Received ${donationType} contribution: ${numAmount ? '₹' + numAmount : item_details} from ${donor_email}`);

    return res.status(201).json({
      success: true,
      message: 'Donation successfully processed! Your digital receipt is ready.',
      receiptNumber,
      paymentRef,
      donor_name,
      amount: numAmount,
      campaign_title,
      type: donationType,
      item_details
    });
  } catch (err) {
    console.error('Donation error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing donation.' });
  }
});

// 3. Get Donation History (for logged-in user or general)
router.get('/history', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM donations';
    const params = [];

    if (req.user.role === 'Donor') {
      sql += ' WHERE donor_id = ? OR LOWER(donor_email) = LOWER(?)';
      params.push(req.user.id, req.user.email);
    } else if (req.user.role !== 'Admin' && req.user.role !== 'Authority') {
      sql += ' WHERE donor_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY created_at DESC';

    const history = db.prepare(sql).all(...params);
    return res.json({ success: true, count: history.length, donations: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving donation history.' });
  }
});

module.exports = router;
