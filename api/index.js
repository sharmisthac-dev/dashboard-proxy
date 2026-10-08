const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());

// Baserow API Configuration
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const CLIENTS_TABLE_ID = '1234385';
const TASKS_TABLE_ID = '1234396';
const VENDORS_TABLE_ID = '1234485';
const INTERNAL_TEAM_TABLE_ID = '1234435';
const COMPLETION_LOG_TABLE_ID = '1234577';

const BASEROW_API = 'https://api.baserow.io/api/database/rows/table';

// Helper function to fetch from Baserow
async function fetchFromBaserow(tableId, pageSize = 200) {
  try {
    const url = `${BASEROW_API}/${tableId}/?page_size=${pageSize}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Baserow API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching from Baserow:', error);
    return [];
  }
}

// Function to calculate metrics from actual Baserow data
async function calculateMetrics() {
  try {
    const clients = await fetchFromBaserow(CLIENTS_TABLE_ID);
    const tasks = await fetchFromBaserow(TASKS_TABLE_ID);
    const vendors = await fetchFromBaserow(VENDORS_TABLE_ID);
    const teamMembers = await fetchFromBaserow(INTERNAL_TEAM_TABLE_ID);
    const completionLog = await fetchFromBaserow(COMPLETION_LOG_TABLE_ID);

    // Calculate overall metrics from tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.Status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.Status === 'Pending').length;
    const inProgressTasks = tasks.filter(t => t.Status === 'In Progress').length;
    const atRiskTasks = tasks.filter(t => t.Status === 'At Risk').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0;

    // If no tasks, use client data
    let displayTotalTasks = totalTasks;
    let displayCompletedTasks = completedTasks;
    let displayPendingTasks = pendingTasks;
    
    if (totalTasks === 0 && clients.length > 0) {
      // Use aggregate data from clients table
      displayTotalTasks = clients.reduce((sum, c) => sum + (c.Total_Tasks || 0), 0);
      displayCompletedTasks = clients.reduce((sum, c) => sum + (c.Completed || 0), 0);
      displayPendingTasks = clients.reduce((sum, c) => sum + (c.Pending || 0), 0);
    }

    // Calculate by handler type
    const internalTeamTasks = tasks.filter(t => t.Handler_Type === 'Internal').length;
    const internalCompleted = tasks.filter(t => t.Handler_Type === 'Internal' && t.Status === 'Completed').length;
    const internalPending = tasks.filter(t => t.Handler_Type === 'Internal' && t.Status === 'Pending').length;

    const idsTasks = tasks.filter(t => t.Handler_Type === 'Vendor' && t.Vendor === 'IDS').length;
    const idsCompleted = tasks.filter(t => t.Handler_Type === 'Vendor' && t.Vendor === 'IDS' && t.Status === 'Completed').length;
    const idsPending = tasks.filter(t => t.Handler_Type === 'Vendor' && t.Vendor === 'IDS' && t.Status === 'Pending').length;

    const v2Tasks = tasks.filter(t => t.Handler_Type === 'Vendor' && t.Vendor === 'V2 Solutions').length;
    const v2Completed = tasks.filter(t => t.Handler_Type === 'Vendor' && t.Vendor === 'V2 Solutions' && t.Status === 'Completed').length;
    const v2Pending = tasks.filter(t => t.Handler_Type === 'Vendor' && t.Vendor === 'V2 Solutions' && t.Status === 'Pending').length;

    // Clients breakdown from tasks OR client table
    const clientsData = {};
    if (tasks.length > 0) {
      tasks.forEach(task => {
        if (!clientsData[task.Client]) {
          clientsData[task.Client] = { total: 0, completed: 0, pending: 0 };
        }
        clientsData[task.Client].total++;
        if (task.Status === 'Completed') clientsData[task.Client].completed++;
        if (task.Status === 'Pending') clientsData[task.Client].pending++;
      });
    } else {
      // Use client table data
      clients.forEach(client => {
        clientsData[client.Name] = {
          total: client.Total_Tasks || 0,
          completed: client.Completed || 0,
          pending: client.Pending || 0
        };
      });
    }

    // Team member performance
    const teamPerformance = teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.Assigned_To === member.Name);
      const completed = memberTasks.filter(t => t.Status === 'Completed').length;
      const pending = memberTasks.filter(t => t.Status === 'Pending').length;
      const total = memberTasks.length;
      const completionPct = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
      
      let status = 'Fair';
      if (completionPct >= 85) status = 'Excellent';
      else if (completionPct >= 75) status = 'Good';
      
      return {
        name: member.Name,
        total,
        completed,
        pending,
        completionPct,
        status
      };
    }).filter(t => t.total > 0);

    // Vendor task details
    const idsTasksList = tasks.filter(t => t.Vendor === 'IDS').slice(0, 10);
    const v2TasksList = tasks.filter(t => t.Vendor === 'V2 Solutions').slice(0, 10);

    return {
      totalTasks: displayTotalTasks,
      completedTasks: displayCompletedTasks,
      pendingTasks: displayPendingTasks,
      inProgressTasks,
      atRiskTasks,
      completionRate: displayTotalTasks > 0 ? Math.round((displayCompletedTasks / displayTotalTasks) * 100 * 10) / 10 : 0,
      internalTeamTasks,
      internalCompleted,
      internalPending,
      idsTasks,
      idsCompleted,
      idsPending,
      v2Tasks,
      v2Completed,
      v2Pending,
      clientsData,
      teamPerformance,
      idsTasksList,
      v2TasksList,
      tasks
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return null;
  }
}

// Generate dashboard HTML
function generateDashboardHTML(metrics) {
  if (!metrics) {
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Dashboard Error</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Error Loading Dashboard</h1>
        <p>Unable to fetch data from Baserow.</p>
      </body>
      </html>
    `;
  }

  const clientsRows = Object.entries(metrics.clientsData).map(([client, data]) => {
    const completionPct = data.total > 0 ? Math.round((data.completed / data.total) * 100 * 10) / 10 : 0;
    const statusClass = completionPct >= 70 ? 'completed' : completionPct >= 50 ? 'pending' : 'at-risk';
    const statusText = completionPct >= 70 ? 'On Track' : completionPct >= 50 ? 'Behind' : 'At Risk';
    
    return `
      <tr>
        <td>${client}</td>
        <td>${data.total.toLocaleString()}</td>
        <td>${data.completed.toLocaleString()}</td>
        <td>${data.pending.toLocaleString()}</td>
        <td>${completionPct}%</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');

  const teamRows = metrics.teamPerformance.map(member => `
    <tr>
      <td>${member.name}</td>
      <td>${member.total}</td>
      <td>${member.completed}</td>
      <td>${member.pending}</td>
      <td>${member.completionPct}%</td>
      <td><span class="status ${member.completionPct >= 85 ? 'completed' : member.completionPct >= 75 ? 'completed' : 'pending'}">${member.status}</span></td>
    </tr>
  `).join('');

  const idsTasksRows = metrics.idsTasksList.map(task => `
    <tr>
      <td>${task.Task_ID}</td>
      <td>${task.Client}</td>
      <td>${task.Category || 'N/A'}</td>
      <td>${task.Items || 'N/A'}</td>
      <td><span class="status ${task.Status.toLowerCase()}">${task.Status}</span></td>
      <td>${task.Due_Date || 'N/A'}</td>
    </tr>
  `).join('');

  const v2TasksRows = metrics.v2TasksList.map(task => `
    <tr>
      <td>${task.Task_ID}</td>
      <td>${task.Client}</td>
      <td>${task.Category || 'N/A'}</td>
      <td>${task.Items || 'N/A'}</td>
      <td><span class="status ${task.Status.toLowerCase()}">${task.Status}</span></td>
      <td>${task.Due_Date || 'N/A'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Performance Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }
        
        h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 5px;
        }
        
        .subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .last-updated {
            color: #999;
            font-size: 12px;
            font-style: italic;
        }
        
        .kpi-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .kpi-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .kpi-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .kpi-value {
            font-size: 28px;
            font-weight: bold;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            flex-wrap: wrap;
        }
        
        .tab-btn {
            padding: 10px 20px;
            border: none;
            background: #f0f0f0;
            color: #333;
            cursor: pointer;
            border-radius: 5px;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .tab-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .tab-content {
            display: none;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }
        
        .tab-content.active {
            display: block;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        
        .status.completed {
            background: #d4edda;
            color: #155724;
        }
        
        .status.pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .status.in-progress {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .status.at-risk {
            background: #f8d7da;
            color: #721c24;
        }
        
        .metric-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .metric-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .metric-detail {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Task Performance Dashboard</h1>
            <p class="subtitle">Real-time task tracking and team performance analytics</p>
            <p class="last-updated">Last updated: ${new Date().toLocaleString()}</p>
            
            <div class="kpi-container">
                <div class="kpi-card">
                    <div class="kpi-label">Total Tasks</div>
                    <div class="kpi-value">${metrics.totalTasks.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completed</div>
                    <div class="kpi-value">${metrics.completedTasks.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Pending</div>
                    <div class="kpi-value">${metrics.pendingTasks.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completion Rate</div>
                    <div class="kpi-value">${metrics.completionRate}%</div>
                </div>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('aggregate')">Aggregate</button>
            <button class="tab-btn" onclick="switchTab('clients')">Clients</button>
            <button class="tab-btn" onclick="switchTab('distribution')">Distribution</button>
            <button class="tab-btn" onclick="switchTab('team')">Internal Team</button>
            <button class="tab-btn" onclick="switchTab('vendors')">Vendors</button>
        </div>
        
        <!-- Aggregate View -->
        <div id="aggregate" class="tab-content active">
            <h2 style="margin-bottom: 20px;">Aggregate Overview</h2>
            <div class="metric-row">
                <div class="metric-box">
                    <div class="metric-label">Internal Team</div>
                    <div class="metric-value">${metrics.internalTeamTasks}</div>
                    <div class="metric-detail">${metrics.internalCompleted} completed | ${metrics.internalPending} pending</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">IDS (Vendor)</div>
                    <div class="metric-value">${metrics.idsTasks}</div>
                    <div class="metric-detail">${metrics.idsCompleted} completed | ${metrics.idsPending} pending</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">V2 Solutions (Vendor)</div>
                    <div class="metric-value">${metrics.v2Tasks}</div>
                    <div class="metric-detail">${metrics.v2Completed} completed | ${metrics.v2Pending} pending</div>
                </div>
            </div>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px;">Task Status Breakdown</h3>
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="status completed">Completed</span></td>
                        <td>${metrics.completedTasks.toLocaleString()}</td>
                        <td>${metrics.completionRate}%</td>
                    </tr>
                    <tr>
                        <td><span class="status pending">Pending</span></td>
                        <td>${metrics.pendingTasks.toLocaleString()}</td>
                        <td>${metrics.totalTasks > 0 ? Math.round((metrics.pendingTasks / metrics.totalTasks) * 100 * 10) / 10 : 0}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Clients View -->
        <div id="clients" class="tab-content">
            <h2 style="margin-bottom: 20px;">Tasks by Client</h2>
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
                    ${clientsRows}
                </tbody>
            </table>
        </div>
        
        <!-- Distribution View -->
        <div id="distribution" class="tab-content">
            <h2 style="margin-bottom: 20px;">Task Distribution by Handler</h2>
            <table>
                <thead>
                    <tr>
                        <th>Handler</th>
                        <th>Type</th>
                        <th>Total Tasks</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Completion Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Internal Team</td>
                        <td>Assigned</td>
                        <td>${metrics.internalTeamTasks}</td>
                        <td>${metrics.internalCompleted}</td>
                        <td>${metrics.internalPending}</td>
                        <td>${metrics.internalTeamTasks > 0 ? Math.round((metrics.internalCompleted / metrics.internalTeamTasks) * 100 * 10) / 10 : 0}%</td>
                    </tr>
                    <tr>
                        <td>IDS</td>
                        <td>Vendor (P2)</td>
                        <td>${metrics.idsTasks}</td>
                        <td>${metrics.idsCompleted}</td>
                        <td>${metrics.idsPending}</td>
                        <td>${metrics.idsTasks > 0 ? Math.round((metrics.idsCompleted / metrics.idsTasks) * 100 * 10) / 10 : 0}%</td>
                    </tr>
                    <tr>
                        <td>V2 Solutions</td>
                        <td>Vendor (P1)</td>
                        <td>${metrics.v2Tasks}</td>
                        <td>${metrics.v2Completed}</td>
                        <td>${metrics.v2Pending}</td>
                        <td>${metrics.v2Tasks > 0 ? Math.round((metrics.v2Completed / metrics.v2Tasks) * 100 * 10) / 10 : 0}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Internal Team View -->
        <div id="team" class="tab-content">
            <h2 style="margin-bottom: 20px;">Internal Team Performance</h2>
            <table>
                <thead>
                    <tr>
                        <th>Team Member</th>
                        <th>Total Assigned</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Completion %</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${teamRows || '<tr><td colspan="6">No team members with assigned tasks</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <!-- Vendors View -->
        <div id="vendors" class="tab-content">
            <h2 style="margin-bottom: 20px;">Vendor Performance</h2>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px;">IDS (V2601)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Task ID</th>
                        <th>Client</th>
                        <th>Category</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${idsTasksRows || '<tr><td colspan="6">No tasks found</td></tr>'}
                </tbody>
            </table>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px;">V2 Solutions (V2602)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Task ID</th>
                        <th>Client</th>
                        <th>Category</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${v2TasksRows || '<tr><td colspan="6">No tasks found</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        function switchTab(tabName) {
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
  `;
}

// Main route
app.get('/', async (req, res) => {
    try {
        const metrics = await calculateMetrics();
        const html = generateDashboardHTML(metrics);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error serving dashboard:', error);
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Dashboard Error</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <h1>Error Loading Dashboard</h1>
            <p>${error.message}</p>
          </body>
          </html>
        `);
    }
});

module.exports = app;
