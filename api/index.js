const express = require('express');

const app = express();
app.use(express.json());

// Full Dashboard with Multi-Level Views
const dashboardHTML = `
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
            
            <div class="kpi-container">
                <div class="kpi-card">
                    <div class="kpi-label">Total Tasks</div>
                    <div class="kpi-value">2,847</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completed</div>
                    <div class="kpi-value">1,923</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Pending</div>
                    <div class="kpi-value">756</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Completion Rate</div>
                    <div class="kpi-value">67.5%</div>
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
                    <div class="metric-value">1,200</div>
                    <div class="metric-detail">456 completed | 744 pending</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">IDS (Vendor)</div>
                    <div class="metric-value">850</div>
                    <div class="metric-detail">520 completed | 330 pending</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">V2 Solutions (Vendor)</div>
                    <div class="metric-value">797</div>
                    <div class="metric-detail">947 completed | 350 pending</div>
                </div>
            </div>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px;">Task Status Breakdown</h3>
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="status completed">Completed</span></td>
                        <td>1,923</td>
                        <td>67.5%</td>
                        <td>All completed tasks across teams</td>
                    </tr>
                    <tr>
                        <td><span class="status pending">Pending</span></td>
                        <td>756</td>
                        <td>26.6%</td>
                        <td>Awaiting completion</td>
                    </tr>
                    <tr>
                        <td><span class="status in-progress">In Progress</span></td>
                        <td>124</td>
                        <td>4.4%</td>
                        <td>Currently being worked on</td>
                    </tr>
                    <tr>
                        <td><span class="status at-risk">At Risk</span></td>
                        <td>44</td>
                        <td>1.5%</td>
                        <td>May miss deadline</td>
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
                    <tr>
                        <td>PUMA</td>
                        <td>650</td>
                        <td>450</td>
                        <td>200</td>
                        <td>69.2%</td>
                        <td><span class="status completed">On Track</span></td>
                    </tr>
                    <tr>
                        <td>Joseph A. Bank</td>
                        <td>520</td>
                        <td>380</td>
                        <td>140</td>
                        <td>73.1%</td>
                        <td><span class="status completed">On Track</span></td>
                    </tr>
                    <tr>
                        <td>The Container Store</td>
                        <td>580</td>
                        <td>350</td>
                        <td>230</td>
                        <td>60.3%</td>
                        <td><span class="status pending">Behind</span></td>
                    </tr>
                    <tr>
                        <td>Rebag</td>
                        <td>750</td>
                        <td>550</td>
                        <td>200</td>
                        <td>73.3%</td>
                        <td><span class="status completed">On Track</span></td>
                    </tr>
                    <tr>
                        <td>Liverpool</td>
                        <td>367</td>
                        <td>193</td>
                        <td>174</td>
                        <td>52.6%</td>
                        <td><span class="status at-risk">At Risk</span></td>
                    </tr>
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
                        <td>1,200</td>
                        <td>876</td>
                        <td>324</td>
                        <td>73.0%</td>
                    </tr>
                    <tr>
                        <td>IDS</td>
                        <td>Vendor (P2)</td>
                        <td>850</td>
                        <td>520</td>
                        <td>330</td>
                        <td>61.2%</td>
                    </tr>
                    <tr>
                        <td>V2 Solutions</td>
                        <td>Vendor (P1)</td>
                        <td>797</td>
                        <td>527</td>
                        <td>270</td>
                        <td>66.1%</td>
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
                    <tr>
                        <td>Tejas Tayade</td>
                        <td>180</td>
                        <td>175</td>
                        <td>5</td>
                        <td>97.2%</td>
                        <td><span class="status completed">Excellent</span></td>
                    </tr>
                    <tr>
                        <td>Eshwari Bhutada</td>
                        <td>210</td>
                        <td>165</td>
                        <td>45</td>
                        <td>78.6%</td>
                        <td><span class="status completed">Good</span></td>
                    </tr>
                    <tr>
                        <td>Nitesh Harne</td>
                        <td>195</td>
                        <td>118</td>
                        <td>77</td>
                        <td>60.5%</td>
                        <td><span class="status pending">Fair</span></td>
                    </tr>
                    <tr>
                        <td>Anuja Patil</td>
                        <td>165</td>
                        <td>142</td>
                        <td>23</td>
                        <td>86.1%</td>
                        <td><span class="status completed">Good</span></td>
                    </tr>
                    <tr>
                        <td>Pallavee Gawande</td>
                        <td>155</td>
                        <td>95</td>
                        <td>60</td>
                        <td>61.3%</td>
                        <td><span class="status pending">Fair</span></td>
                    </tr>
                    <tr>
                        <td>Shrikant Shinde</td>
                        <td>175</td>
                        <td>137</td>
                        <td>38</td>
                        <td>78.3%</td>
                        <td><span class="status completed">Good</span></td>
                    </tr>
                    <tr>
                        <td>Vinita Shende</td>
                        <td>170</td>
                        <td>144</td>
                        <td>26</td>
                        <td>84.7%</td>
                        <td><span class="status completed">Good</span></td>
                    </tr>
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
                    <tr>
                        <td>TASK-V2-001</td>
                        <td>PUMA</td>
                        <td>Product Enrichment</td>
                        <td>280</td>
                        <td><span class="status completed">Completed</span></td>
                        <td>2026-10-05</td>
                    </tr>
                    <tr>
                        <td>TASK-V2-002</td>
                        <td>Rebag</td>
                        <td>Dimension Tagging</td>
                        <td>320</td>
                        <td><span class="status completed">Completed</span></td>
                        <td>2026-10-08</td>
                    </tr>
                    <tr>
                        <td>TASK-V2-003</td>
                        <td>The Container Store</td>
                        <td>Category Classification</td>
                        <td>250</td>
                        <td><span class="status pending">Pending</span></td>
                        <td>2026-10-15</td>
                    </tr>
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
                    <tr>
                        <td>TASK-V2S-001</td>
                        <td>Joseph A. Bank</td>
                        <td>Material Classification</td>
                        <td>210</td>
                        <td><span class="status completed">Completed</span></td>
                        <td>2026-10-06</td>
                    </tr>
                    <tr>
                        <td>TASK-V2S-002</td>
                        <td>Liverpool</td>
                        <td>Quality Check</td>
                        <td>195</td>
                        <td><span class="status pending">Pending</span></td>
                        <td>2026-10-12</td>
                    </tr>
                    <tr>
                        <td>TASK-V2S-003</td>
                        <td>iCanvas</td>
                        <td>Style Tagging</td>
                        <td>392</td>
                        <td><span class="status in-progress">In Progress</span></td>
                        <td>2026-10-20</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        function switchTab(tabName) {
            // Hide all tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Remove active class from all buttons
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
`;

// Serve dashboard at root
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(dashboardHTML);
});

module.exports = app;
