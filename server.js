require('dotenv').config(); // Add this line at the top

const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = 3000;
const cors = require('cors');
const path = require('path');

// Enable CORS for all routes
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const sheets = google.sheets('v4');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const spreadsheetId = '1aJEVYDgVxhXVpOZrc8-JvHtwDXrX3v77jNZwPOad0vY';
const sheetName = 'Data';

const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json', // Path to your JSON key file
    scopes: SCOPES,
});

app.get('/api/data', async (req, res) => {
    const { blockNo, partNo, thickness } = req.query;

    try {
        const authClient = await auth.getClient();
        const response = await sheets.spreadsheets.values.get({
            auth: authClient,
            spreadsheetId,
            range: `${sheetName}!A:W`,
        });

        const rows = response.data.values;
        let filteredData = rows.filter(row => row[0] && row[0].toLowerCase() === blockNo.toLowerCase());

        if (partNo) {
            filteredData = filteredData.filter(row => row[1] && row[1].toLowerCase() === partNo.toLowerCase());
        }
        if (thickness) {
            filteredData = filteredData.filter(row => row[2] && row[2].toLowerCase() === thickness.toLowerCase());
        }

        res.json(filteredData);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});