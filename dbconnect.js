require("dotenv").config(); // Load environment variables
var util = require('util');

const mysql = require("mysql2/promise"); // Using mysql2 with promises

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true, // If true, the pool will queue requests when no connections are available
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0, // Unlimited queueing (0 means no limit)
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.')
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.')
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.')
    }
  }

  if (connection) connection.release()

  return
})


module.exports = pool;
