const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());

const BASEROW_TOKEN = 'uI7xifG0amjvJFF13BDa6HYqw4GvfyWP';
const CLIENTS_TABLE = '1234385';

async function getClients() {
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
    return data.results || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

app.get('/', async (req, res) => {
  const clients = await getClients();
  
  // Sum up totals from all clients
  let totalTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  
  clients.forEach(client => {
    totalTasks += client.Total_Tasks || 0;
    completedTasks += client.Completed || 0;
    pendingTasks += client.Pending || 0;
  });
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0;
  
  // Build client rows
  const clientRows = clients.map(client => {
    const total = client.Total_Tasks || 0;
    const completed = client.Completed || 0;
    const pending = client.Pending || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
    const statusClass = pct >= 70 ? 'completed' : pct >= 50 ? 'pending' : 'at-risk';
    const statusText = pct >= 70 ? 'On Track' : pct >= 50 ? 'Behind' : 'At Risk';
    
    return `
      <tr>
        <td>${client.Name}</td>
        <td>${total.toLocaleString()}</td>
        <td>${completed.toLocaleString()}</td>
        <td>${pending.toLocaleString()}</td>
        <td>${pct}%</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Performance Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; background: #f5f7fa; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        h1 { color: #333; font-size: 32px; margin-bottom: 5px; }
        .subtitle { color: #666; font-size: 16px; margin-bottom: 10px; }
        .kpi-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .kpi-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .kpi-label { font-size: 12px; opacity: 0.9; text-transform: uppercase; margin-bottom: 5px; }
        .kpi-value { font-size: 28px; font-weight: bold; }
        .content { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
        th { background: #f8f9fa; font-weight: 600; color: #333; }
        tr:hover { background: #f8f9fa; }
        .status { padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
        .status.completed { background: #d4edda; color: #155724; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.at-risk { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Task Performance Dashboard</h1>
            <p class="subtitle">Real-time task tracking and team performance analytics</p>
            
            <div class="kpi-container">
                <div class="kpi-card">
                    <div class="kpi-label">Total Tasks</div>
                    <div class="kpi-value">${totalTasks.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completed</div>
                    <div class="kpi-value">${completedTasks.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Pending</div>
                    <div class="kpi-value">${pendingTasks.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completion Rate</div>
                    <div class="kpi-value">${completionRate}%</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <h2 style="margin-bottom: 20px;">Clients Overview</h2>
            <table>
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Total Tasks</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Completion %</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientRows}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = app;
