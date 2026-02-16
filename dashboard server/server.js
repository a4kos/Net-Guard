/**
 * Net Guard Data Server
 * Bridges Electron app scanning data with the web dashboard
 * Provides REST API and WebSocket real-time updates
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store (in production, use a real database)
let scanData = {
  totalExtensions: 0,
  totalThreats: 0,
  criticalThreats: 0,
  highThreats: 0,
  mediumThreats: 0,
  lowThreats: 0,
  extensionsAtRisk: 0,
  scanLogs: [],
  threats: [],
  extensions: [],
  lastScanTime: null
};

// Track threat history for charts
let threatHistory = [];
const MAX_HISTORY = 50; // Keep last 50 data points

/**
 * REST API Endpoints
 */

// Get current statistics
app.get('/api/stats', (req, res) => {
  res.json({
    extensions: scanData.totalExtensions,
    total: scanData.totalThreats,
    critical: scanData.criticalThreats,
    high: scanData.highThreats,
    medium: scanData.mediumThreats,
    low: scanData.lowThreats,
    extensionsAtRisk: scanData.extensionsAtRisk,
    lastScanTime: scanData.lastScanTime
  });
});

// Get all threats
app.get('/api/threats', (req, res) => {
  const { severity } = req.query;
  
  let threats = scanData.threats;
  
  if (severity && severity !== 'all') {
    threats = threats.filter(t => t.severity === severity);
  }
  
  res.json(threats);
});

// Get all extensions
app.get('/api/extensions', (req, res) => {
  res.json(scanData.extensions);
});

// Get threat history for charts
app.get('/api/threat-history', (req, res) => {
  res.json(threatHistory);
});

// Get scan logs
app.get('/api/scan-logs', (req, res) => {
  res.json(scanData.scanLogs);
});

/**
 * POST endpoint to receive scan data from Electron app
 */
app.post('/api/scan-complete', (req, res) => {
  const { extensions, threats, scanTime } = req.body;
  
  console.log(`[Server] Received scan data: ${extensions?.length || 0} extensions, ${threats?.length || 0} threats`);
  
  // Update statistics
  updateScanData(extensions, threats, scanTime);
  
  // Broadcast to all connected clients
  io.emit('scan_complete', {
    totalExtensions: scanData.totalExtensions,
    totalThreats: scanData.totalThreats,
    criticalThreats: scanData.criticalThreats,
    timestamp: scanTime
  });
  
  res.json({ status: 'success', message: 'Scan data received' });
});

/**
 * POST endpoint to receive individual threat detections in real-time
 */
app.post('/api/threat-detected', (req, res) => {
  const threat = req.body;
  
  console.log(`[Server] New threat detected: ${threat.type} - ${threat.severity}`);
  
  // Add threat to data store
  addThreat(threat);
  
  // Broadcast to all connected clients immediately
  io.emit('new_threat', threat);
  
  res.json({ status: 'success', message: 'Threat received' });
});

/**
 * Update scan data from scan results
 */
function updateScanData(extensions, threats, scanTime) {
  // Update extensions
  scanData.extensions = extensions || [];
  scanData.totalExtensions = scanData.extensions.length;
  
  // Categorize threats by severity
  const threatCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  let extensionsAtRisk = 0;
  
  if (extensions) {
    extensions.forEach(ext => {
      if (ext.riskScore >= 4) {
        threatCounts.critical++;
        extensionsAtRisk++;
      } else if (ext.riskScore >= 3) {
        threatCounts.high++;
        extensionsAtRisk++;
      } else if (ext.riskScore >= 2) {
        threatCounts.medium++;
        extensionsAtRisk++;
      } else if (ext.riskScore >= 1) {
        threatCounts.low++;
      }
    });
  }
  
  // Update threat counters
  scanData.criticalThreats = threatCounts.critical;
  scanData.highThreats = threatCounts.high;
  scanData.mediumThreats = threatCounts.medium;
  scanData.lowThreats = threatCounts.low;
  scanData.totalThreats = threatCounts.critical + threatCounts.high + threatCounts.medium + threatCounts.low;
  scanData.extensionsAtRisk = extensionsAtRisk;
  scanData.lastScanTime = scanTime || new Date().toISOString();
  
  // Store threats
  if (threats) {
    scanData.threats = threats;
  }
  
  // Add to scan logs
  scanData.scanLogs.push({
    timestamp: scanData.lastScanTime,
    found: scanData.totalThreats,
    critical: threatCounts.critical,
    high: threatCounts.high,
    medium: threatCounts.medium,
    low: threatCounts.low
  });
  
  // Keep only last 100 scans
  if (scanData.scanLogs.length > 100) {
    scanData.scanLogs = scanData.scanLogs.slice(-100);
  }
  
  // Update threat history for charts
  updateThreatHistory();
}

/**
 * Add a single threat detection
 */
function addThreat(threat) {
  // Add timestamp if not present
  if (!threat.timestamp) {
    threat.timestamp = new Date().toISOString();
  }
  
  // Add to threats array
  scanData.threats.unshift(threat);
  
  // Keep only last 500 threats
  if (scanData.threats.length > 500) {
    scanData.threats = scanData.threats.slice(0, 500);
  }
  
  // Update counters
  scanData.totalThreats++;
  
  switch (threat.severity) {
    case 'critical':
      scanData.criticalThreats++;
      break;
    case 'high':
      scanData.highThreats++;
      break;
    case 'medium':
      scanData.mediumThreats++;
      break;
    case 'low':
      scanData.lowThreats++;
      break;
  }
  
  scanData.extensionsAtRisk++;
  
  // Update history
  updateThreatHistory();
}

/**
 * Update threat history for time-series charts
 */
function updateThreatHistory() {
  const now = new Date();
  
  threatHistory.push({
    timestamp: now.toISOString(),
    time: now.toLocaleTimeString(),
    critical: scanData.criticalThreats,
    high: scanData.highThreats,
    medium: scanData.mediumThreats,
    low: scanData.lowThreats,
    total: scanData.totalThreats
  });
  
  // Keep only last MAX_HISTORY points
  if (threatHistory.length > MAX_HISTORY) {
    threatHistory = threatHistory.slice(-MAX_HISTORY);
  }
}

/**
 * WebSocket connection handling
 */
io.on('connection', (socket) => {
  console.log('[Server] Client connected:', socket.id);
  
  // Send current stats on connection
  socket.emit('initial_data', {
    stats: scanData,
    history: threatHistory
  });
  
  socket.on('disconnect', () => {
    console.log('[Server] Client disconnected:', socket.id);
  });
  
  // Handle manual scan request from dashboard
  socket.on('request_scan', () => {
    console.log('[Server] Manual scan requested');
    // This would trigger a scan in the Electron app
    // For now, just acknowledge
    socket.emit('scan_started', { status: 'scanning' });
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/**
 * Serve dashboard HTML
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Net Guard Data Server running on port ${PORT}`);
  console.log(`[Server] Dashboard: http://localhost:${PORT}`);
  console.log(`[Server] API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

module.exports = { app, io, server };
