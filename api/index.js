const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const BASEROW_TOKEN = 'uI7xifG0amjvJFF13BDa6HYqw4GvfyWP';
const CLIENTS_TABLE = '1234385';

app.get('/', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/rows/table/${CLIENTS_TABLE}/?page_size=200`,
      {
        headers: {
          'Authorization': `Token ${BASEROW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    const clients = data.results || [];
    
    // Debug: show first record structure
    const debugInfo = clients.length > 0 ? JSON.stringify(clients[0], null, 2) : 'No data';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Debug - Baserow Data</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        pre { background: white; padding: 20px; border-radius: 5px; overflow-x: auto; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>🔍 Baserow Data Debug</h1>
    <p><strong>Total records found:</strong> ${clients.length}</p>
    
    <h2>First Record Structure:</h2>
    <pre>${debugInfo}</pre>
    
    <h2>All Field Names:</h2>
    <pre>${clients.length > 0 ? JSON.stringify(Object.keys(clients[0]), null, 2) : 'No data'}</pre>
    
    <h2>Raw Response:</h2>
    <pre>${JSON.stringify(data, null, 2).substring(0, 2000)}</pre>
    
    <p><a href="/">Back to Dashboard</a></p>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.send(`<h1>Error</h1><pre>${error.message}</pre>`);
  }
});

module.exports = app;
