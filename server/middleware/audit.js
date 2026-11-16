const { db } = require('../config/database');

function logAudit(req, action, entity, details) {
  try {
    const userId = req.user ? req.user.id : null;
    const userEmail = (req.user && req.user.email) ? req.user.email : ((req.body && req.body.email) ? req.body.email : 'Anonymous');
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, userEmail, action, entity, typeof details === 'object' ? JSON.stringify(details) : details, ipAddress);
  } catch (err) {
    console.error('Audit logging error:', err.message);
  }
}

module.exports = {
  logAudit
};
