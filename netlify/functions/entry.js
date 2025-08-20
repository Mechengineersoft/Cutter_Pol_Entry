const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const spreadsheetId = '1aJEVYDgVxhXVpOZrc8-JvHtwDXrX3v77jNZwPOad0vY';
const sheetName = 'HP';

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
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.date || !data.mc || !data.operator || !Array.isArray(data.blocks) || data.blocks.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const authClient = await auth.getClient();
    const sheets = google.sheets('v4');

    // Prepare rows for batch update
    const rows = data.blocks.map(block => [
      data.date,
      data.mc,
      data.operator,
      block.blockNo,
      block.thk,
      block.lcm,
      block.hcm,
      block.nos,
      block.finish,
      block.colour,
      block.remarks
    ]);

    // Append rows to the sheet
    const response = await sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId,
      range: `${sheetName}!A:K`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: rows,
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Data added successfully',
        updatedRows: response.data.updates.updatedRows,
      }),
    };
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      credentials: {
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasPrivateKeyId: !!process.env.GOOGLE_PRIVATE_KEY_ID,
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientX509: !!process.env.GOOGLE_CLIENT_X509_CERT_URL
      }
    });
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        type: error.name,
        code: error.code
      }),
    };
  }
};}