const express = require('express');

const app = express();
app.use(express.json());

// Static HTML Dashboard with Sample Data
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        th, td {
            padding: 15px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Task Dashboard</h1>
            <p class="subtitle">Real-time task performance and status</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Task ID</th>
                    <th>Vendor</th>
                    <th>Client</th>
                    <th>Category</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Due Date</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>TASK-001</td>
                    <td>IDS</td>
                    <td>PUMA</td>
                    <td>Product Enrichment</td>
                    <td>250</td>
                    <td><span class="status completed">Completed</span></td>
                    <td>2026-10-05</td>
                </tr>
                <tr>
                    <td>TASK-002</td>
                    <td>V2 Solutions</td>
                    <td>Joseph A. Bank</td>
                    <td>Category Classification</td>
                    <td>180</td>
                    <td><span class="status pending">Pending</span></td>
                    <td>2026-10-12</td>
                </tr>
                <tr>
                    <td>TASK-003</td>
                    <td>IDS</td>
                    <td>The Container Store</td>
                    <td>Dimension Tagging</td>
                    <td>320</td>
                    <td><span class="status completed">Completed</span></td>
                    <td>2026-10-08</td>
                </tr>
                <tr>
                    <td>TASK-004</td>
                    <td>V2 Solutions</td>
                    <td>Liverpool</td>
                    <td>Material Classification</td>
                    <td>210</td>
                    <td><span class="status pending">Pending</span></td>
                    <td>2026-10-15</td>
                </tr>
                <tr>
                    <td>TASK-005</td>
                    <td>IDS</td>
                    <td>iCanvas</td>
                    <td>Style Tagging</td>
                    <td>450</td>
                    <td><span class="status pending">Pending</span></td>
                    <td>2026-10-20</td>
                </tr>
                <tr>
                    <td>TASK-006</td>
                    <td>V2 Solutions</td>
                    <td>QC Supply</td>
                    <td>Quality Check</td>
                    <td>150</td>
                    <td><span class="status completed">Completed</span></td>
                    <td>2026-10-06</td>
                </tr>
                <tr>
                    <td>TASK-007</td>
                    <td>IDS</td>
                    <td>Rebag</td>
                    <td>Product Enrichment</td>
                    <td>280</td>
                    <td><span class="status pending">Pending</span></td>
                    <td>2026-10-18</td>
                </tr>
                <tr>
                    <td>TASK-008</td>
                    <td>V2 Solutions</td>
                    <td>Puma UK</td>
                    <td>Care Instructions</td>
                    <td>190</td>
                    <td><span class="status completed">Completed</span></td>
                    <td>2026-10-07</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`;

// Serve dashboard at root
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(dashboardHTML);
});

module.exports = app;
