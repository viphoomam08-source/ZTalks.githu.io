const mysql = require('mysql2');

// Force TiDB fallback if process.env.DB_HOST is empty or explicitly set to localhost in production
const hostEnv = process.env.DB_HOST;
const dbHost = (hostEnv && hostEnv !== 'localhost' && hostEnv !== '127.0.0.1') 
  ? hostEnv 
  : 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';

const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';

const pool = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER || '2QBkasbhCJn7hSu.root',
  password: process.env.DB_PASSWORD || 'we7qLkqsgnRBYtTr',
  database: process.env.DB_NAME || 'genz',
  port: Number(process.env.DB_PORT) || 4000,
  
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