const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/audit');

// 1. Get All Volunteers (for Coordinator/Admin)
router.get('/', authenticateToken, requireRoles('Coordinator', 'Authority', 'Admin'), (req, res) => {
  try {
    const volunteers = db.prepare(`
      SELECT v.*, u.name, u.email, u.phone, u.location as user_location,
        COUNT(vt.id) as total_tasks,
        COALESCE(SUM(CASE WHEN vt.status = 'In Progress' THEN 1 ELSE 0 END), 0) as active_tasks
      FROM volunteers v
      JOIN users u ON u.id = v.user_id
      LEFT JOIN volunteer_tasks vt ON vt.volunteer_id = v.id
      GROUP BY v.id
      ORDER BY v.tasks_completed DESC
    `).all();

    return res.json({ success: true, count: volunteers.length, volunteers });
  } catch (err) {
    console.error('Fetch volunteers error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving volunteers.' });
  }
});

// 2. Get Volunteer Profile for Current Logged-in User
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const volunteer = db.prepare(`
      SELECT v.*, u.name, u.email, u.phone, u.location
      FROM volunteers v
      JOIN users u ON u.id = v.user_id
      WHERE v.user_id = ?
    `).get(req.user.id);

    if (!volunteer) {
      return res.json({ success: false, isVolunteer: false, message: 'User is not registered as a volunteer.' });
    }

    const tasks = db.prepare(`
      SELECT * FROM volunteer_tasks WHERE volunteer_id = ? ORDER BY created_at DESC
    `).all(volunteer.id);

    return res.json({ success: true, isVolunteer: true, volunteer, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving volunteer profile.' });
  }
});

// 3. Register or Update Volunteer Profile (SCRUM-27: Skill Profiling)
router.post('/register', authenticateToken, (req, res) => {
  const { skills, assigned_area, availability_status } = req.body;

  if (!skills) {
    return res.status(400).json({ success: false, message: 'Skills must be specified (e.g. Medical, Rescue, Logistics).' });
  }

  try {
    const existing = db.prepare('SELECT id FROM volunteers WHERE user_id = ?').get(req.user.id);

    if (existing) {
      db.prepare(`
        UPDATE volunteers 
        SET skills = ?, assigned_area = COALESCE(?, assigned_area), availability_status = COALESCE(?, availability_status)
        WHERE id = ?
      `).run(skills, assigned_area || null, availability_status || 'Available', existing.id);

      return res.json({ success: true, message: 'Volunteer profile updated successfully.' });
    } else {
      // Update role in users table to Volunteer if not already higher
      if (req.user.role === 'Citizen') {
        db.prepare("UPDATE users SET role = 'Volunteer' WHERE id = ?").run(req.user.id);
      }

      db.prepare(`
        INSERT INTO volunteers (user_id, skills, assigned_area, availability_status)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, skills, assigned_area || 'Central Operations', availability_status || 'Available');

      logAudit(req, 'VOLUNTEER_REGISTER', `Volunteer:User:${req.user.id}`, `User enrolled as volunteer with skills: ${skills}`);

      return res.status(201).json({ success: true, message: 'Successfully registered as a volunteer!' });
    }
  } catch (err) {
    console.error('Volunteer registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error registering volunteer.' });
  }
});

// 4. Update Task Status (SCRUM-27: Task completion reporting)
router.patch('/tasks/:taskId/status', authenticateToken, (req, res) => {
  const { taskId } = req.params;
  const { status, proof_notes } = req.body;

  const validStatuses = ['Assigned', 'In Progress', 'Completed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Assigned, In Progress, or Completed.' });
  }

  try {
    const task = db.prepare('SELECT * FROM volunteer_tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const completedAt = status === 'Completed' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE volunteer_tasks 
      SET status = ?, proof_notes = COALESCE(?, proof_notes), completed_at = ?
      WHERE id = ?
    `).run(status, proof_notes || null, completedAt, taskId);

    if (status === 'Completed') {
      db.prepare('UPDATE volunteers SET tasks_completed = tasks_completed + 1 WHERE id = ?').run(task.volunteer_id);
    }

    logAudit(req, 'UPDATE_TASK_STATUS', `Task:${taskId}`, `Status set to ${status}. Notes: ${proof_notes || 'None'}`);

    return res.json({ success: true, message: `Task status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating task status.' });
  }
});

module.exports = router;
