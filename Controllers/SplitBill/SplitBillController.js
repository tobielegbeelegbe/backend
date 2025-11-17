// userController.js
// This file contains all the basic CRUD controllers for user management in a Node.js application using Express.js and MySQL (via mysql2 package).
// Assumptions:
// - You have a MySQL database with a 'users' table: id (INT, AUTO_INCREMENT, PRIMARY KEY), name (VARCHAR), email (VARCHAR, UNIQUE), password (VARCHAR).
// - Database connection is handled in '../config/database.js' exporting a mysql2 pool (e.g., const pool = mysql.createPool({...}); module.exports = pool;).
// - Install dependencies: npm install express mysql2 (and bcrypt for production password hashing).
// - In production, always hash passwords (e.g., using bcrypt) and add input validation (e.g., using Joi or express-validator).
// - These controllers handle basic operations: GET all users, GET by ID, POST create, PUT update, DELETE by ID.

const crypto = require('crypto');
const SplitBill = require('../../Models/splitbill')



// Get all users
const getSplitBill = async (req, res) => {
    const { bill_id } = req.body;
  try {
          console.log("TEST DATA :");
          const result = await SplitBill.getSpliBills(bill_id);
          
          if(!result)
          {
            return res.status(400).json({ msg: 'Incorrect Bill ID' });
          }
        res.status(200).json({ msg: 'Loaded successfully', result });
            
             // res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  finally
  {
    con.release();
  }
};



module.exports = {
  getSplitBill,
};