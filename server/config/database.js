const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Path for SQLite database file
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vanguard_ops.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Citizen',
      location TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS disasters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_km REAL NOT NULL DEFAULT 10,
      affected_area TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS relief_requests (
      id TEXT PRIMARY KEY,
      citizen_id INTEGER NOT NULL,
      citizen_name TEXT NOT NULL,
      citizen_phone TEXT,
      disaster_id TEXT NOT NULL,
      request_type TEXT NOT NULL,
      urgency TEXT NOT NULL,
      people_affected INTEGER NOT NULL DEFAULT 1,
      latitude REAL,
      longitude REAL,
      address TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      priority TEXT DEFAULT NULL,
      coordinator_notes TEXT DEFAULT NULL,
      rejection_reason TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (citizen_id) REFERENCES users(id),
      FOREIGN KEY (disaster_id) REFERENCES disasters(id)
    );

    CREATE TABLE IF NOT EXISTS resources_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      warehouse_location TEXT NOT NULL,
      min_threshold INTEGER NOT NULL DEFAULT 50,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL,
      resource_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity_allocated INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Allocated',
      volunteer_id INTEGER DEFAULT NULL,
      allocated_at TEXT DEFAULT (datetime('now')),
      delivered_at TEXT DEFAULT NULL,
      FOREIGN KEY (request_id) REFERENCES relief_requests(id),
      FOREIGN KEY (resource_id) REFERENCES resources_inventory(id)
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      skills TEXT NOT NULL,
      availability_status TEXT NOT NULL DEFAULT 'Available',
      assigned_area TEXT,
      tasks_completed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS volunteer_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER NOT NULL,
      request_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'Assigned',
      proof_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT DEFAULT NULL,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS donation_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      disaster_id TEXT,
      target_amount REAL NOT NULL,
      raised_amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (disaster_id) REFERENCES disasters(id)
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_name TEXT NOT NULL,
      donor_email TEXT NOT NULL,
      donor_id INTEGER,
      type TEXT NOT NULL DEFAULT 'Monetary',
      amount REAL DEFAULT 0,
      item_details TEXT,
      campaign_title TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Card',
      payment_ref TEXT NOT NULL,
      receipt_number TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sos_alerts (
      id TEXT PRIMARY KEY,
      citizen_id INTEGER,
      citizen_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      location_name TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      responded_by TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL,
      role_target TEXT DEFAULT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read_status INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      details TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
