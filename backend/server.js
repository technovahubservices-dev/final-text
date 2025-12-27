const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { saveExtraction } = require('./database');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../fronted')));

// Basic root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../fronted/index.html'));
});

// The endpoint your frontend will call
app.post('/api/upload', upload.single('report'), async (req, res) => {
    try {
        const filePath = req.file.path;
        
        // 1. Prepare data for n8n
        const formData = new FormData();
        formData.append('data', fs.createReadStream(filePath));

        // 2. Forward to your n8n production URL
        const n8nResponse = await axios.post('https://technova112.app.n8n.cloud/webhook/extract-report', formData, {
            headers: formData.getHeaders()
        });

        const keywords = n8nResponse.data;

        // 3. Save to Database
        await saveExtraction(req.file.originalname, keywords);

        // 4. Clean up the local file
        fs.unlinkSync(filePath);

        // 5. Respond to Frontend
        res.json({ success: true, keywords: keywords });
    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to process report' });
    }
});

module.exports = app;