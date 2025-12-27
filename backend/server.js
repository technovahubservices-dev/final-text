const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { saveExtraction } = require('./database');

const app = express();
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

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
        // Validate file exists
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        // Validate file type (optional - adjust as needed)
        const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(txt|pdf|doc|docx)$/i)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid file type. Please upload TXT, PDF, or DOC files.' 
            });
        }

        const filePath = req.file.path;
        
        // 1. Prepare data for n8n
        const formData = new FormData();
        formData.append('data', fs.createReadStream(filePath));

        // 2. Forward to your n8n production URL with timeout
        const n8nResponse = await axios.post('https://technova112.app.n8n.cloud/webhook/extract-report', formData, {
            headers: formData.getHeaders(),
            timeout: 30000, // 30 second timeout
            maxContentLength: 10 * 1024 * 1024, // 10MB max
        });

        // Validate n8n response
        if (!n8nResponse.data) {
            throw new Error('No response from extraction service');
        }

        const keywords = n8nResponse.data;

        // 3. Save to Database
        try {
            await saveExtraction(req.file.originalname, keywords);
        } catch (dbError) {
            console.error('Database Error:', dbError.message);
            // Continue even if DB save fails
        }

        // 4. Clean up the local file
        try {
            fs.unlinkSync(filePath);
        } catch (cleanupError) {
            console.error('File cleanup Error:', cleanupError.message);
        }

        // 5. Respond to Frontend
        res.json({ 
            success: true, 
            keywords: keywords,
            filename: req.file.originalname
        });
    } catch (error) {
        console.error('Server Error:', error.message);
        
        // Clean up file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleanup on failure:', cleanupError.message);
            }
        }

        // Provide specific error messages
        let errorMessage = 'Failed to process report';
        if (error.code === 'ECONNABORTED') {
            errorMessage = 'Processing timeout. Please try again.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Service unavailable. Please try again later.';
        } else if (error.response && error.response.status === 413) {
            errorMessage = 'File too large. Please upload a smaller file.';
        }

        res.status(500).json({ 
            success: false, 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = app;