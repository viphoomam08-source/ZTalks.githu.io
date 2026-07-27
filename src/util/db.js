const mysql = require('mysql2');

const dbHost = process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';

// Local MySQL (XAMPP/WAMP) doesn't support SSL, but TiDB Cloud strictly requires it.
const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';

const pool = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER || '2QBkasbhCJn7hSu.root',
  password: process.env.DB_PASSWORD || 'we7qLkqsgnRBYtTr',
  database: process.env.DB_NAME || 'genz',
  port: Number(process.env.DB_PORT) || 4000,
  
  // Disable SSL ONLY if connecting to local XAMPP/MySQL. Enable for TiDB Cloud.
  ssl: isLocalhost ? false : { minVersion: 'TLSv1.2', rejectUnauthorized: true },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Test the connection on startup
async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Connected to database successfully!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();

module.exports = db;