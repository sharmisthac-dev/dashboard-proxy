const express = require('express');

const app = express();
app.use(express.json());

// Baserow credentials
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TASKS_TABLE_ID = process.env.TASKS_TABLE_ID;

// HTML Dashboard
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
        
        .loading {
            text-align: center;
            color: white;
            padding: 40px;
            font-size: 18px;
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
        }
        
        .status.completed {
            background: #d4edda;
            color: #155724;
        }
        
        .status.pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Task Dashboard</h1>
            <p class="subtitle">Real-time task performance and status</p>
        </div>
        
        <div id="content">
            <div class="loading">Loading tasks...</div>
        </div>
    </div>
    
    <script>
        const API_BASE_URL = window.location.origin;
        
        async function loadTasks() {
            try {
                const response = await fetch(\`\${API_BASE_URL}/api/tasks\`);
                
                if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }
                
                const tasks = await response.json();
                renderTasks(tasks);
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('content').innerHTML = 
                    \`<div class="error">Error loading tasks: \${error.message}</div>\`;
            }
        }
        
        function renderTasks(tasks) {
            const container = document.getElementById('content');
            
            if (!tasks || tasks.length === 0) {
                container.innerHTML = '<div class="loading">No tasks found.</div>';
                return;
            }
            
            let html = '<table>';
            html += '<thead><tr>';
            html += '<th>Task ID</th>';
            html += '<th>Vendor</th>';
            html += '<th>Client</th>';
            html += '<th>Category</th>';
            html += '<th>Items</th>';
            html += '<th>Status</th>';
            html += '<th>Due Date</th>';
            html += '</tr></thead>';
            html += '<tbody>';
            
            tasks.forEach(task => {
                const statusClass = task.status === 'Completed' ? 'completed' : 'pending';
                html += '<tr>';
                html += '<td>' + (task.task_id || 'N/A') + '</td>';
                html += '<td>' + (task.vendor || 'N/A') + '</td>';
                html += '<td>' + (task.client || 'N/A') + '</td>';
                html += '<td>' + (task.category || 'N/A') + '</td>';
                html += '<td>' + (task.items_count || 0) + '</td>';
                html += '<td><span class="status ' + statusClass + '">' + (task.status || 'Pending') + '</span></td>';
                html += '<td>' + (task.due_date || 'N/A') + '</td>';
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }
        
        // Load tasks on page load
        window.addEventListener('load', loadTasks);
    </script>
</body>
</html>
`;

// Serve dashboard at root
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(dashboardHTML);
});

// API endpoint - get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const response = await fetch(
            \`https://api.baserow.io/api/database/rows/table/\${TASKS_TABLE_ID}/\`,
            {
                headers: {
                    'Authorization': \`Token \${BASEROW_TOKEN}\`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(\`Baserow API error: \${response.status}\`);
        }
        
        const data = await response.json();
        const tasks = data.results.map(row => ({
            task_id: row.fields.task_id || 'N/A',
            vendor: row.fields.vendor_name || 'N/A',
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

module.exports = app;
