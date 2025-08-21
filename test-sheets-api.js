// Test script to verify Google Sheets API connection
require('dotenv').config();
const { google } = require('googleapis');

// Log environment variable lengths to help diagnose issues
const requiredEnvVars = [
  'GOOGLE_PRIVATE_KEY_ID',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_X509_CERT_URL'
];

console.log('Environment variable lengths:');
requiredEnvVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? process.env[varName].length : 0} characters`);
});

// Check if private key is properly formatted
if (process.env.GOOGLE_PRIVATE_KEY && !process.env.GOOGLE_PRIVATE_KEY.includes('\n')) {
  console.warn('GOOGLE_PRIVATE_KEY does not contain newline characters. This may cause issues.');
}

// Initialize auth with GoogleAuth
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: 'login-451104',
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Test connection to Google Sheets API
async function testSheetsConnection() {
  try {
    console.log('Testing Google Sheets API connection...');
    
    // Get client
    const client = await auth.getClient();
    console.log('Successfully authenticated with Google API');
    
    // Create sheets API client
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // Test with a simple API call
    const spreadsheetId = '1aJEVYDgVxhXVpOZrc8-JvHtwDXrX3v77jNZwPOad0vY';
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    console.log('Successfully connected to Google Sheets API');
    console.log(`Spreadsheet title: ${response.data.properties.title}`);
    return true;
  } catch (error) {
    console.error('Error connecting to Google Sheets API:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Run the test and write results to file
const fs = require('fs');
const logFile = 'api-test-results.txt';
let logOutput = '';

// Override console.log and console.error to capture output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function() {
  const args = Array.from(arguments);
  logOutput += args.join(' ') + '\n';
  originalConsoleLog.apply(console, args);
};

console.error = function() {
  const args = Array.from(arguments);
  logOutput += 'ERROR: ' + args.join(' ') + '\n';
  originalConsoleError.apply(console, args);
};

testSheetsConnection()
  .then(success => {
    if (success) {
      console.log('✅ Test completed successfully');
    } else {
      console.log('❌ Test failed');
    }
    
    // Write results to file
    fs.writeFileSync(logFile, logOutput);
    originalConsoleLog(`Results written to ${logFile}`);
  });