const express = require('express');

const app = express();
app.use(express.json());

// Vendor API keys
const VENDOR_KEYS = {
  'vendor-ids-v2601': 'IDS',
  'vendor-v2solutions-v2602': 'V2 Solutions'
};

// Baserow credentials
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TASKS_TABLE_ID = process.env.TASKS_TABLE_ID;

// Vendor authentication middleware
const authenticateVendor = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !VENDOR_KEYS[apiKey]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.vendorName = VENDOR_KEYS[apiKey];
  next();
};

// Get vendor info
app.get('/vendor-info', authenticateVendor, (req, res) => {
  res.json({ name: req.vendorName });
});

// Get vendor tasks
app.get('/vendor-tasks', authenticateVendor, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TASKS_TABLE_ID}/`,
      {
        headers: {
          'Authorization': `Token ${BASEROW_TOKEN}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Baserow API error: ${response.status}`);
    }
    
    const data = await response.json();
    const tasks = data.results
      .filter(row => row.fields.vendor_name === req.vendorName)
      .map(row => ({
        task_id: row.fields.task_id || 'N/A',
        client: row.fields.client_name || 'N/A',
        category: row.fields.category || 'N/A',
        items_count: row.fields.item_count || 0,
        status: row.fields.status || 'Pending',
        due_date: row.fields.due_date || 'N/A'
      }));
    
    res.json(tasks);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
