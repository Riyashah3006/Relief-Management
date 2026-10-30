const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 1. Get Operational Summary KPIs & Analytics
router.get('/analytics', authenticateToken, (req, res) => {
  try {
    // Total incidents
    const incidents = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_incidents
      FROM disasters
    `).get();

    // Relief requests stats
    const requests = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(people_affected), 0) as total_people_affected,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM relief_requests
    `).get();

    // Requests breakdown by type
    const byType = db.prepare(`
      SELECT request_type, COUNT(*) as count, COALESCE(SUM(people_affected), 0) as people
      FROM relief_requests
      GROUP BY request_type
      ORDER BY count DESC
    `).all();

    // Requests breakdown by urgency
    const byUrgency = db.prepare(`
      SELECT urgency, COUNT(*) as count
      FROM relief_requests
      GROUP BY urgency
      ORDER BY 
        CASE urgency
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          ELSE 4
        END
    `).all();

    // Inventory status
    const inventory = db.prepare(`
      SELECT 
        category,
        COUNT(*) as item_types,
        COALESCE(SUM(quantity), 0) as total_units,
        SUM(CASE WHEN quantity <= min_threshold THEN 1 ELSE 0 END) as low_stock_items
      FROM resources_inventory
      GROUP BY category
    `).all();

    // Total donations raised
    const donations = db.prepare(`
      SELECT 
        COUNT(*) as total_donations,
        COALESCE(SUM(amount), 0) as total_funds_raised
      FROM donations
      WHERE type = 'Monetary'
    `).get();

    // Volunteers count
    const volunteers = db.prepare(`
      SELECT 
        COUNT(*) as total_volunteers,
        SUM(CASE WHEN availability_status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN availability_status = 'On Mission' THEN 1 ELSE 0 END) as on_mission,
        COALESCE(SUM(tasks_completed), 0) as completed_tasks
      FROM volunteers
    `).get();

    // SOS beacons
    const sos = db.prepare(`
      SELECT 
        COUNT(*) as total_sos,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_sos,
        SUM(CASE WHEN status = 'Responded' THEN 1 ELSE 0 END) as responded_sos,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_sos
      FROM sos_alerts
    `).get();

    return res.json({
      success: true,
      summary: {
        totalIncidents: incidents.total || 0,
        activeIncidents: incidents.active_incidents || 0,
        totalRequests: requests.total || 0,
        totalPeopleAffected: requests.total_people_affected || 0,
        pendingReview: requests.submitted || 0,
        underReview: requests.under_review || 0,
        approvedRequests: requests.approved || 0,
        completedRequests: requests.completed || 0,
        rejectedRequests: requests.rejected || 0,
        totalFundsRaised: donations.total_funds_raised || 0,
        totalVolunteers: volunteers.total_volunteers || 0,
        activeVolunteers: volunteers.on_mission || 0,
        activeSOS: sos.active_sos || 0
      },
      charts: {
        byType,
        byUrgency,
        inventory,
        requestsBreakdown: {
          submitted: requests.submitted || 0,
          under_review: requests.under_review || 0,
          approved: requests.approved || 0,
          completed: requests.completed || 0,
          rejected: requests.rejected || 0
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating reports and analytics.' });
  }
});

module.exports = router;
