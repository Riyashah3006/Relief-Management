const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../app.js');
const { db } = require('../config/database');

let server;
let baseUrl;
let citizenToken = '';
let coordinatorToken = '';
let adminToken = '';

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Login as Citizen to obtain JWT
  const citRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@relief.org', password: 'Password@123' })
  });
  const citData = await citRes.json();
  citizenToken = citData.token;

  // Login as Coordinator
  const coordRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'coordinator@relief.org', password: 'Password@123' })
  });
  const coordData = await coordRes.json();
  coordinatorToken = coordData.token;

  // Login as Admin
  const admRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@relief.org', password: 'Password@123' })
  });
  const admData = await admRes.json();
  adminToken = admData.token;
});

test.after(async () => {
  if (server) {
    server.close();
  }
});

test('Health Check API - System Online', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ONLINE');
});

// ==========================================
// Jira Epic: User & Auth Management (SCRUM-22)
// ==========================================

test('[SCRUM-33] Citizen Registration - Valid Input Creates Account', async () => {
  const testEmail = `testuser_${Date.now()}@relief.org`;
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Citizen',
      email: testEmail,
      phone: '+91 99999 88888',
      password: 'Password@123',
      location: 'Ward 12, Mumbai'
    })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'Citizen');
});

test('[SCRUM-33] Citizen Registration - Missing Fields Validation', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Incomplete User' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('[SCRUM-33] Citizen Registration - Rejects Duplicate Email', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Check',
      email: 'citizen@relief.org',
      password: 'Password@123'
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.match(data.message, /already registered/i);
});

test('[SCRUM-34] User Login - Valid Credentials', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'coordinator@relief.org', password: 'Password@123' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.token);
  assert.strictEqual(data.user.role, 'Coordinator');
  assert.strictEqual(data.redirectUrl, '/coordinator');
});

test('[SCRUM-34] User Login - Invalid Password Rejection', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'coordinator@relief.org', password: 'WrongPassword!' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Invalid email or password/i);
});

test('[SCRUM-35] Password Reset - Generates 30-min Token', async () => {
  const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@relief.org' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.resetToken);
});

test('[SCRUM-36] Role-Based Access Control - 403 Forbidden for Unauthorized Role', async () => {
  // Citizen trying to access Coordinator queue
  const res = await fetch(`${baseUrl}/api/requests/coordinator/queue`, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Access forbidden/i);
});

// ==========================================
// Jira Epic: Disaster Incident Management (SCRUM-23)
// ==========================================

test('[SCRUM-38] View Active Disasters - Retrieval & Filtering', async () => {
  const res = await fetch(`${baseUrl}/api/disasters?status=Active`, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.disasters));
  assert.ok(data.disasters.length >= 1);
});

test('[SCRUM-37] Create Disaster Incident - Authority Role', async () => {
  const res = await fetch(`${baseUrl}/api/disasters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Automated Test Incident Floods',
      type: 'Flood',
      severity: 'Critical',
      latitude: 19.1234,
      longitude: 72.8899,
      radius_km: 12,
      affected_area: 'Test Sector 5',
      description: 'Automated agile testing incident for verification.'
    })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.match(data.disaster.id, /^DIS-\d+/);
});

// ==========================================
// Jira Epic: Relief Request Management (SCRUM-24)
// ==========================================

let createdRequestId = '';

test('[SCRUM-39] Submit Relief Request - Citizen Creates Request with Unique ID', async () => {
  const res = await fetch(`${baseUrl}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${citizenToken}`
    },
    body: JSON.stringify({
      disaster_id: 'DIS-001',
      request_type: 'Food',
      urgency: 'Critical',
      people_affected: 5,
      address: 'Test Lowlands Sector 2',
      description: 'Trapped on terrace, water knee deep.'
    })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.match(data.requestId, /^REQ-\d+/);
  createdRequestId = data.requestId;
});

test('[SCRUM-40] View My Relief Requests - Citizen Receives Their Submissions', async () => {
  const res = await fetch(`${baseUrl}/api/requests/my`, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  const found = data.requests.some(r => r.id === createdRequestId);
  assert.strictEqual(found, true);
});

test('[SCRUM-41] Review and Prioritize - Coordinator Prioritizes to Under Review', async () => {
  const res = await fetch(`${baseUrl}/api/requests/${createdRequestId}/prioritize`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordinatorToken}`
    },
    body: JSON.stringify({
      priority: 'Critical',
      coordinator_notes: 'Urgent boat required. Prioritized for rapid unit.'
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.request.status, 'Under Review');
  assert.strictEqual(data.request.priority, 'Critical');
});

test('[SCRUM-42] Approve or Reject - Rejection Requires Mandatory Reason', async () => {
  const res = await fetch(`${baseUrl}/api/requests/${createdRequestId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordinatorToken}`
    },
    body: JSON.stringify({ rejection_reason: '' }) // Empty
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.match(data.message, /Mandatory rejection reason/i);
});

test('[SCRUM-42] Approve or Reject - Approval Moves to Approved', async () => {
  const res = await fetch(`${baseUrl}/api/requests/${createdRequestId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordinatorToken}`
    },
    body: JSON.stringify({ comments: 'Approved for 5 ration packets.' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.request.status, 'Approved');
});

// ==========================================
// Jira Tasks: SOS Module & Inventory (SCRUM-17, SCRUM-25)
// ==========================================

test('[SCRUM-17] Emergency SOS Beacon - Panic Dispatch with GPS', async () => {
  const res = await fetch(`${baseUrl}/api/sos/panic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${citizenToken}`
    },
    body: JSON.stringify({
      citizen_name: 'Amit Kumar',
      phone: '+91 98206 66778',
      latitude: 19.0657,
      longitude: 72.8790,
      location_name: 'Kurla West Sector 4',
      message: 'Trapped on roof, need evacuation!'
    })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.match(data.sosId, /^SOS-/);
  assert.strictEqual(data.status, 'Active');
});

test('[SCRUM-25 & SCRUM-26] Resource Allocation - Stock Deduction', async () => {
  // Get an inventory item
  const inv = db.prepare('SELECT id, quantity FROM resources_inventory LIMIT 1').get();
  const initialQty = inv.quantity;

  const res = await fetch(`${baseUrl}/api/allocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${coordinatorToken}`
    },
    body: JSON.stringify({
      request_id: createdRequestId,
      resource_id: inv.id,
      quantity: 2
    })
  });
  assert.strictEqual(res.status, 201);

  // Verify stock deduction
  const updatedInv = db.prepare('SELECT quantity FROM resources_inventory WHERE id = ?').get(inv.id);
  assert.strictEqual(updatedInv.quantity, initialQty - 2);
});
