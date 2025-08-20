require('dotenv').config(); // Add this line at the top

const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = 5000;
const cors = require('cors');
const path = require('path');

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const sheets = google.sheets('v4');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const spreadsheetId = '1aJEVYDgVxhXVpOZrc8-JvHtwDXrX3v77jNZwPOad0vY';
const sheetName = 'CutterData';

const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json', // Path to your JSON key file
    scopes: SCOPES,
});

app.get('/api/data', async (req, res) => {
    const { blockNo, partNo, thickness } = req.query;

    // Return empty array if no blockNo provided
    if (!blockNo) {
        return res.json([]);
    }

    try {
        const authClient = await auth.getClient();
        const response = await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId,
            range: `${sheetName}!A:W`,
        });

        const rows = response.data.values || [];
        let filteredData = rows.filter(row => row[0] && row[0].toLowerCase() === blockNo.toLowerCase());

        if (partNo) {
            filteredData = filteredData.filter(row => row[1] && row[1].toLowerCase() === partNo.toLowerCase());
        }
        if (thickness) {
            filteredData = filteredData.filter(row => row[2] && row[2].toLowerCase() === thickness.toLowerCase());
        }

        res.json(filteredData);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

// Entry endpoint for form submissions
app.post('/api/entry', async (req, res) => {
    try {
        const { date, mc, operator, blocks } = req.body;

        // Validate request body
        if (!date || !mc || !operator || !Array.isArray(blocks) || blocks.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate each block entry
        for (const block of blocks) {
            if (!block.blockNo || !block.thk || !block.lcm || !block.hcm || !block.nos || !block.finish || !block.colour) {
                return res.status(400).json({ error: 'Missing required fields in block entry' });
            }
        }

        const authClient = await auth.getClient();

        // Prepare the rows to be inserted
        const rows = blocks.map(block => [
            date,                   // Date
            mc,                     // M/C
            operator,               // Operator
            block.blockNo,          // Block No
            block.thk,              // Thk
            block.lcm,              // L cm
            block.hcm,              // H cm
            block.nos,              // Nos
            block.finish,           // Finish
            block.colour,           // Colour
            block.remarks           // Remarks
        ]);

        // Append the rows to the HP sheet
        await sheets.spreadsheets.values.append({
            auth: authClient,
            spreadsheetId,
            range: 'HP!A:K',        // Using the HP sheet
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: rows
            }
        });

        res.json({ 
            message: 'Data submitted successfully',
            rowsAdded: rows.length
        });
    } catch (error) {
        console.error('Error submitting data:', error);
        const errorMessage = error.message || 'Failed to submit data';
        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});