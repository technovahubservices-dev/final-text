const express = require('express');
const path = require('path');

const app = express();

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../fronted')));

// Basic root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../fronted/index.html'));
});

// Test API endpoint
app.post('/api/upload', (req, res) => {
    res.json({ success: true, keywords: 'test,keyword,extraction' });
});

app.listen(3001, () => {
    console.log('Simple server running on http://localhost:3001');
});
