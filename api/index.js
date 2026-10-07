// Dashboard Backend Proxy for Vercel
// Keeps Baserow API key secure and proxies vendor requests

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Environment variables (set in Vercel dashboard)
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const BASEROW_URL = 'https://api.baserow.io';
const BASEROW_DB_ID = process.env.BASEROW_DB_ID;

// Vendor API keys - UPDATE THESE WITH YOUR VENDORS
const VENDOR_KEYS = {
  'vendor-ids-v2601': { name: 'IDS', permissions: ['read:tasks', 'read:own_assignments'] },
  'vendor-v2solutions-v2602': { name: 'V2 Solutions', permissions: ['read:tasks', 'read:own_assignments'] },
};

app.use(cors());
app.use(express.json());

// Middleware: Authenticate vendor API key
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !VENDOR_KEYS[apiKey]) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  req.vendor = {
    key: apiKey,
    name: VENDOR_KEYS[apiKey].name,
    permissions: VENDOR_KEYS[apiKey].permissions,
  };
  
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', vendor: 'Connected', timestamp: new Date().toISOString() });
});

// Proxy: Get all tasks (read-only, filtered by vendor)
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const response = await fetch(
      `${BASEROW_URL}/api/database/rows/table/${process.env.TASKS_TABLE_ID}/?user_field_names=true`,
      {
        headers: {
          Authorization: `Token ${BASEROW_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch tasks from Baserow' });
    }

    const data = await response.json();
    let filteredTasks = data.results || [];

    // Filter tasks for this vendor only
    if (req.vendor.permissions.includes('read:own_assignments')) {
      filteredTasks = filteredTasks.filter(
        task => task.assigned_vendor === req.vendor.name || task.vendor === req.vendor.name
      );
    }

    res.json({ tasks: filteredTasks, vendor: req.vendor.name, total: filteredTasks.length });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy: Get task by ID
app.get('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const response = await fetch(
      `${BASEROW_URL}/api/database/rows/table/${process.env.TASKS_TABLE_ID}/${req.params.id}/?user_field_names=true`,
      {
        headers: {
          Authorization: `Token ${BASEROW_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Task not found' });
    }

    const task = await response.json();

    // Permission check
    if (task.assigned_vendor !== req.vendor.name && task.vendor !== req.vendor.name) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy: Get vendor metrics
app.get('/api/vendors/:vendorId', authenticate, async (req, res) => {
  try {
    if (req.vendor.name !== req.params.vendorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const response = await fetch(
      `${BASEROW_URL}/api/database/rows/table/${process.env.VENDORS_TABLE_ID}/?user_field_names=true&filter__name__iexact=${req.params.vendorId}`,
      {
        headers: {
          Authorization: `Token ${BASEROW_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch vendor data' });
    }

    const data = await response.json();
    res.json(data.results?.[0] || {});
  } catch (error) {
    console.error('Error fetching vendor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend proxy running on http://localhost:${PORT}`);
  });
}
