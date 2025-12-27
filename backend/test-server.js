const express = require('express');
const path = require('path');

const app = express();

// Test basic route
app.get('/', (req, res) => {
    res.send('Hello World - Server is working!');
});

// Test static file serving
app.use(express.static(path.join(__dirname, '../fronted')));

app.listen(3000, () => {
    console.log('Test server running on http://localhost:3000');
    console.log('Frontend path:', path.join(__dirname, '../fronted'));
});
