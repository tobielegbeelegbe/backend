const pool = require('../dbconnect');
const bcrypt = require('bcryptjs');


const dbMiddleware = async (req, res, next) => {
    try {
        req.db = await pool.getConnection();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).send('Database connection failed.');
    } finally {
        // Release the connection back to the pool after the request is handled (if applicable)
        if (req.db) req.db.release(); // This is a better pattern if using connection per request
    }
};

module.exports = { pool, dbMiddleware };