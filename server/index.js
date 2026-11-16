const express = require('express');
const { seedDatabase } = require('./config/seed');

seedDatabase();

const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  Vanguard Ops Relief Management Server Online!`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  API Health:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
