const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { seedDatabase } = require('./config/seed');

// Initialize database schema and seed if fresh
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/disasters', require('./routes/disasters'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

// Base health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Vanguard Ops: Disaster Relief Management Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files if built (Production / Docker mode)
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <h1>Vanguard Ops API Server Online</h1>
        <p>Port: ${PORT}</p>
        <p>Frontend is running via Vite dev server or run <code>npm run build</code> in /client.</p>
      `);
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  Vanguard Ops Relief Management Server Online!`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  API Health:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = app;
