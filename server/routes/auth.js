const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { db } = require('../config/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// 1. Citizen Registration (SCRUM-33)
router.post('/register', (req, res) => {
  const { name, email, phone, password, location } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are mandatory fields.'
    });
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  try {
    // Check if email already registered (SCRUM-33 AC3)
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please log in or use a different email.'
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    // Assign default role "Citizen" (SCRUM-36 AC3)
    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, location)
      VALUES (?, ?, ?, ?, 'Citizen', ?)
    `);

    stmt.run(name, email.toLowerCase(), phone || '', passwordHash, location || '');

    const newUser = db.prepare('SELECT id, name, email, role, location FROM users WHERE LOWER(email) = LOWER(?)').get(email);

    logAudit(req, 'CITIZEN_REGISTRATION', `User:${newUser.id}`, `New citizen registered: ${email}`);

    // Create a verification notification for the citizen
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message)
      VALUES (?, 'Citizen', 'Welcome to Vanguard Ops', 'Your account has been created. A verification email has been simulated and sent.')
    `).run(newUser.id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Verification email has been sent. You can now log in.',
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

// 2. User Login (SCRUM-34)
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check account lockout status (SCRUM-34 AC3: locked for 15 minutes after 5 failed attempts)
    if (user.locked_until) {
      const lockTime = new Date(user.locked_until).getTime();
      const now = Date.now();
      if (now < lockTime) {
        const remainingMinutes = Math.ceil((lockTime - now) / 60000);
        return res.status(403).json({
          success: false,
          message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
        });
      } else {
        // Unlock if expired
        db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
        user.failed_attempts = 0;
        user.locked_until = null;
      }
    }

    // Verify password
    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      const newFailed = (user.failed_attempts || 0) + 1;
      let lockUntilVal = null;

      // 5 failed attempts -> 6th lock for 15 mins
      if (newFailed >= 5) {
        lockUntilVal = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(newFailed, lockUntilVal, user.id);

        logAudit(req, 'ACCOUNT_LOCKED', `User:${user.id}`, `Account locked after ${newFailed} failed attempts`);

        return res.status(403).json({
          success: false,
          message: 'Account is temporarily locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      } else {
        db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(newFailed, user.id);
        const remaining = 5 - newFailed;
        return res.status(400).json({
          success: false,
          message: `Invalid email or password. (${remaining} attempt(s) remaining before account lockout)`
        });
      }
    }

    // Successful login: reset failed_attempts
    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit(req, 'USER_LOGIN', `User:${user.id}`, `User logged in with role: ${user.role}`);

    // Map role to redirect dashboard route (SCRUM-34 AC1)
    const roleRoutes = {
      Citizen: '/citizen',
      Coordinator: '/coordinator',
      Volunteer: '/volunteer',
      Donor: '/donor',
      Authority: '/authority',
      Admin: '/admin'
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      redirectUrl: roleRoutes[user.role] || '/',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
});

// 3. Password Reset Request (SCRUM-35 AC1: sends reset link valid for 30 minutes)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email address.'
    });
  }

  try {
    const user = db.prepare('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with that email address.'
      });
    }

    // Generate secure 30-minute token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).run(user.id, token, expiresAt);

    logAudit(req, 'FORGOT_PASSWORD_REQUEST', `User:${user.id}`, `Reset token generated for ${email}`);

    // In a real email setup, an email is sent; for the demo application, we return the reset token and reset URL
    const resetUrl = `/reset-password?token=${token}`;

    return res.json({
      success: true,
      message: 'Password reset link generated and valid for 30 minutes.',
      resetToken: token,
      resetUrl
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset request.'
    });
  }
});

// 4. Password Reset Execution (SCRUM-35 AC2 & AC3)
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Reset token and new password are required.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.'
    });
  }

  try {
    const record = db.prepare(`
      SELECT pr.*, u.email 
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.token = ? AND pr.used = 0
    `).get(token);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used password reset link.'
      });
    }

    // Check expiration (SCRUM-35 AC3)
    const expires = new Date(record.expires_at).getTime();
    if (Date.now() > expires) {
      return res.status(400).json({
        success: false,
        message: 'Link expired, request a new one'
      });
    }

    // Hash new password and update
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?').run(newHash, record.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(record.id);

    logAudit(req, 'PASSWORD_RESET_SUCCESS', `User:${record.user_id}`, `Password updated successfully via reset token`);

    return res.json({
      success: true,
      message: 'Password successfully updated. You may now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while resetting password.'
    });
  }
});

// 5. Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, location, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
