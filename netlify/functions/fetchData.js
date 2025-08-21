const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const spreadsheetId = '1aJEVYDgVxhXVpOZrc8-JvHtwDXrX3v77jNZwPOad0vY';
const sheetName = 'CutterData';

// Validate environment variables
const requiredEnvVars = [
  'GOOGLE_PRIVATE_KEY_ID',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_X509_CERT_URL'
];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Log environment variable lengths to help diagnose issues
console.log('Environment variable lengths:');
requiredEnvVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? process.env[varName].length : 0} characters`);
});

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
  scopes: SCOPES,
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const { blockNo, partNo, thickness } = event.queryStringParameters || {};

  // Return empty array if no blockNo provided
  if (!blockNo) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([]),
    };
  }

  try {
    const authClient = await auth.getClient();
    const sheets = google.sheets('v4');
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId,
      range: `${sheetName}!A:W`,
    });

    const rows = response.data.values;
    let filteredData = rows.filter((row) => row[0] && row[0].toLowerCase() === blockNo.toLowerCase());

    if (partNo) {
      filteredData = filteredData.filter((row) => row[1] && row[1].toLowerCase() === partNo.toLowerCase());
    }
    if (thickness) {
      filteredData = filteredData.filter((row) => row[2] && row[2].toLowerCase() === thickness.toLowerCase());
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(filteredData),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};