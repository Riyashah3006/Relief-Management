const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./database');

function seedDatabase() {
  initSchema();

  // Check if users already exist
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers && existingUsers.count > 0) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding Vanguard Ops database with initial data...');

  const passwordHash = bcrypt.hashSync('Password@123', 10);

  // 1. Seed Users (all 6 roles)
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, location)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Dr. Rajesh Sharma', 'admin@relief.org', '+91 98201 11223', passwordHash, 'Admin', 'Mumbai HQ');
  insertUser.run('Commissioner Ananya Deshmukh', 'authority@relief.org', '+91 98202 22334', passwordHash, 'Authority', 'Disaster Control Directorate');
  insertUser.run('Vikram Malhotra', 'coordinator@relief.org', '+91 98203 33445', passwordHash, 'Coordinator', 'Central Relief Coordination Zone');
  insertUser.run('Rohan Verma', 'volunteer@relief.org', '+91 98204 44556', passwordHash, 'Volunteer', 'Kurla Field Unit');
  insertUser.run('Pooja Patel', 'donor@relief.org', '+91 98205 55667', passwordHash, 'Donor', 'Bandra, Mumbai');
  insertUser.run('Amit Kumar', 'citizen@relief.org', '+91 98206 66778', passwordHash, 'Citizen', 'Kurla Lowlands, Mumbai');
  insertUser.run('Sneha Roy', 'sneha.volunteer@relief.org', '+91 98207 77889', passwordHash, 'Volunteer', 'Dadar Sector 2');

  // 2. Seed Disasters (SCRUM-37, SCRUM-38)
  const insertDisaster = db.prepare(`
    INSERT INTO disasters (id, title, type, severity, latitude, longitude, radius_km, affected_area, description, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDisaster.run(
    'DIS-001',
    'Mumbai Coastal Flooding & Tidal Surge',
    'Flood',
    'Critical',
    19.0760,
    72.8777,
    15,
    'Kurla, Dharavi, Sion Lowlands',
    'Continuous heavy rainfall combined with a 4.8m high tide has submerged ground floors and disrupted road and rail transit. Urgent rescue boats and food supply needed.',
    'Active',
    'Commissioner Ananya Deshmukh'
  );

  insertDisaster.run(
    'DIS-002',
    'Assam Brahmaputra River Spillage',
    'Flood',
    'High',
    26.1445,
    91.7362,
    25,
    'Guwahati & Kamrup Rural District',
    'Brahmaputra river flowing 1.5m above danger mark. Over 12 villages inundated; evacuation to relief camps in progress.',
    'Active',
    'Commissioner Ananya Deshmukh'
  );

  insertDisaster.run(
    'DIS-003',
    'Uttarakhand Hillside Landslide Incident',
    'Landslide',
    'Critical',
    30.0869,
    78.2676,
    8,
    'Rishikesh-Badrinath National Highway Sector 4',
    'Major hillside collapse blocking supply corridor. Multiple vehicles stranded; temporary shelter and trauma medical response deployed.',
    'Active',
    'Commissioner Ananya Deshmukh'
  );

  insertDisaster.run(
    'DIS-004',
    'Odisha Cyclone Warning & Tidal Evacuation',
    'Cyclone',
    'Medium',
    19.8135,
    85.8312,
    30,
    'Puri Coastal Belt',
    'Depression intensifying into deep cyclonic storm. Precautionary evacuation of 15,000 coastal residents to multi-purpose cyclone shelters.',
    'Active',
    'Commissioner Ananya Deshmukh'
  );

  // 3. Seed Relief Requests (SCRUM-39, SCRUM-40, SCRUM-41, SCRUM-42)
  const insertRequest = db.prepare(`
    INSERT INTO relief_requests (id, citizen_id, citizen_name, citizen_phone, disaster_id, request_type, urgency, people_affected, latitude, longitude, address, description, status, priority, coordinator_notes, rejection_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRequest.run(
    'REQ-1001',
    6,
    'Amit Kumar',
    '+91 98206 66778',
    'DIS-001',
    'Food',
    'High',
    6,
    19.0657,
    72.8790,
    'Room 14, Chawl No 3, Near Bail Bazar, Kurla West',
    'Family of 6 including 2 senior citizens stranded on 1st floor. Water in street is waist-deep. Need drinking water and dry ration packets.',
    'Submitted',
    null,
    null,
    null
  );

  insertRequest.run(
    'REQ-1002',
    6,
    'Amit Kumar',
    '+91 98206 66778',
    'DIS-001',
    'Medical',
    'Critical',
    2,
    19.0680,
    72.8810,
    'Building 7, Kamani Compound, Kurla West',
    'Elderly patient needs essential insulin medication and sterile wound dressings. Power is down.',
    'Under Review',
    'Critical',
    'Verified with local ward officer; forwarding to medical rapid response unit.',
    null
  );

  insertRequest.run(
    'REQ-1003',
    6,
    'Amit Kumar',
    '+91 98206 66778',
    'DIS-001',
    'Shelter',
    'High',
    10,
    19.0720,
    72.8750,
    'Municipal School Ground, Sion East',
    'Temporary shelter needed for 10 people whose roof leaked and partially collapsed. Need blankets and tarpaulin sheets.',
    'Approved',
    'High',
    'Approved for 10 emergency thermal blankets and 2 family tents.',
    null
  );

  insertRequest.run(
    'REQ-1004',
    6,
    'Amit Kumar',
    '+91 98206 66778',
    'DIS-001',
    'Clothing',
    'Low',
    4,
    19.0790,
    72.8710,
    'Transit Camp Block 9, Dharavi',
    'Dry clothes and footwear for 4 children whose belongings were soaked.',
    'Completed',
    'Low',
    'Delivered by Volunteer Rohan Verma on 28/Oct.',
    null
  );

  // 4. Seed Resources Inventory (SCRUM-25)
  const insertResource = db.prepare(`
    INSERT INTO resources_inventory (item_name, category, quantity, unit, warehouse_location, min_threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertResource.run('Ready-to-Eat High Protein Meal Packets', 'Food & Water', 2400, 'packets', 'Warehouse A - Kurla Depot', 100);
  insertResource.run('Potable Drinking Water (5L Cans)', 'Food & Water', 3500, 'cans', 'Warehouse A - Kurla Depot', 150);
  insertResource.run('Emergency Medical Trauma Kits', 'Medical', 450, 'kits', 'Central Medical Logistics Depot', 50);
  insertResource.run('Water Purification Chlorine Tablets', 'Medical', 12000, 'strips', 'Central Medical Logistics Depot', 500);
  insertResource.run('Emergency Thermal Blankets & Bedding', 'Bedding & Shelter', 1800, 'units', 'Warehouse B - Dadar Hub', 100);
  insertResource.run('Waterproof All-Weather Family Tents (4-Person)', 'Bedding & Shelter', 220, 'units', 'Warehouse B - Dadar Hub', 30);
  insertResource.run('Emergency Raincoats & Child Clothing Packs', 'Clothing', 950, 'packs', 'Warehouse B - Dadar Hub', 50);
  insertResource.run('Sanitation & Hygiene Care Kits', 'Sanitation', 1400, 'kits', 'Warehouse A - Kurla Depot', 80);

  // 5. Seed Allocations (SCRUM-26)
  const insertAlloc = db.prepare(`
    INSERT INTO allocations (request_id, resource_id, item_name, quantity_allocated, status, volunteer_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAlloc.run('REQ-1003', 5, 'Emergency Thermal Blankets & Bedding', 10, 'Dispatched', 1);
  insertAlloc.run('REQ-1003', 6, 'Waterproof All-Weather Family Tents (4-Person)', 2, 'In Transit', 1);

  // 6. Seed Volunteers & Tasks (SCRUM-27)
  const insertVol = db.prepare(`
    INSERT INTO volunteers (user_id, skills, availability_status, assigned_area, tasks_completed)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertVol.run(4, 'Search & Rescue, First-Aid CPR, Inflatable Boat Pilot', 'Available', 'Kurla Lowlands', 14);
  insertVol.run(7, 'Emergency Nursing, Trauma Care, Child Nutrition', 'On Mission', 'Dadar Sector 2', 9);

  const insertTask = db.prepare(`
    INSERT INTO volunteer_tasks (volunteer_id, request_id, title, description, location, status, proof_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run(
    1,
    'REQ-1003',
    'Deliver 10 Blankets and 2 Tents to Municipal School',
    'Transport allocated shelter materials from Dadar Hub to Municipal School Ground Sion East.',
    'Municipal School Ground, Sion East',
    'In Progress',
    'Pickup completed from Warehouse B, en route via rescue truck.'
  );

  insertTask.run(
    2,
    'REQ-1002',
    'Deliver Emergency Insulin & Wound Dressings',
    'Dispense refrigerated insulin to patient family at Building 7, Kamani Compound.',
    'Building 7, Kamani Compound, Kurla West',
    'Assigned',
    null
  );

  // 7. Seed Donation Campaigns & Donations (SCRUM-28)
  const insertCampaign = db.prepare(`
    INSERT INTO donation_campaigns (title, disaster_id, target_amount, raised_amount, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCampaign.run(
    'Mumbai Monsoon Disaster Emergency Relief Fund',
    'DIS-001',
    5000000,
    2845000,
    'Direct aid for food distribution, community kitchen setups, and immediate rescue boat operations in submerged wards.',
    'Active'
  );

  insertCampaign.run(
    'Brahmaputra Flood Evacuation & Health Relief',
    'DIS-002',
    3000000,
    1450000,
    'Providing potable drinking water, anti-venom, and floating medical clinics across affected riverine districts.',
    'Active'
  );

  insertCampaign.run(
    'Himalayan Landslide Rapid Medical Aid',
    'DIS-003',
    2000000,
    1120000,
    'Emergency trauma surgical support, helicopter airdrop of dry rations, and slope stabilization gear.',
    'Active'
  );

  const insertDonation = db.prepare(`
    INSERT INTO donations (donor_name, donor_email, donor_id, type, amount, item_details, campaign_title, payment_method, payment_ref, receipt_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDonation.run(
    'Pooja Patel',
    'donor@relief.org',
    5,
    'Monetary',
    50000,
    null,
    'Mumbai Monsoon Disaster Emergency Relief Fund',
    'UPI / Net Banking',
    'TXN_UPI_9981827361',
    'RCP-2026-8821'
  );

  insertDonation.run(
    'Ratan Logistics Corp',
    'csr@ratanlogistics.in',
    null,
    'Monetary',
    100000,
    null,
    'Mumbai Monsoon Disaster Emergency Relief Fund',
    'Corporate Card',
    'TXN_CARD_7736281920',
    'RCP-2026-8822'
  );

  insertDonation.run(
    'Pooja Patel',
    'donor@relief.org',
    5,
    'Supplies',
    0,
    '500 Bottles of Antiseptic Hand Sanitizer & 100 Baby Food Jars',
    'Brahmaputra Flood Evacuation & Health Relief',
    'Direct Dispatch',
    'WAYBILL_BLR_44812',
    'RCP-2026-8823'
  );

  // 8. Seed SOS Distress Alerts (SCRUM-17, SCRUM-30)
  const insertSOS = db.prepare(`
    INSERT INTO sos_alerts (id, citizen_id, citizen_name, phone, latitude, longitude, location_name, message, status, responded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSOS.run(
    'SOS-901',
    6,
    'Amit Kumar',
    '+91 98206 66778',
    19.0657,
    72.8790,
    'Kurla West Lowlands',
    'Water level rose by 3 feet in the last 40 minutes! 5 people including infant trapped on rooftop. Battery dying!',
    'Active',
    null
  );

  insertSOS.run(
    'SOS-902',
    null,
    'Kavita Solanki',
    '+91 98111 22334',
    19.0820,
    72.8830,
    'Sion Station Road',
    'Tree collapsed over vehicle with 2 passengers inside. Road flooded.',
    'Responded',
    'Officer Deshmukh'
  );

  // 9. Seed Notifications (SCRUM-29)
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, role_target, title, message, link)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertNotification.run(
    null,
    'Coordinator',
    'Emergency Alert: Mumbai Coastal Flooding',
    'New Critical severity incident DIS-001 declared. Emergency coordination protocol activated.',
    '/disasters/DIS-001'
  );

  insertNotification.run(
    6,
    'Citizen',
    'Relief Request Status Update: REQ-1003',
    'Your relief request REQ-1003 has been Approved! Resources are currently being dispatched.',
    '/requests'
  );

  // 10. Seed Audit Logs (SCRUM-32)
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, action, entity, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(1, 'admin@relief.org', 'SYSTEM_INITIALIZATION', 'System', 'Vanguard Ops Relief Management System schema and demo data initialized', '127.0.0.1');
  insertAudit.run(2, 'authority@relief.org', 'CREATE_DISASTER', 'Disaster:DIS-001', 'Created incident Mumbai Coastal Flooding & Tidal Surge', '192.168.1.10');
  insertAudit.run(3, 'coordinator@relief.org', 'APPROVE_REQUEST', 'Request:REQ-1003', 'Approved request for 10 people shelter assistance', '192.168.1.15');

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
