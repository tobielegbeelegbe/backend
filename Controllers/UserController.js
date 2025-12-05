// userController.js
// This file contains all the basic CRUD controllers for user management in a Node.js application using Express.js and MySQL (via mysql2 package).
// Assumptions:
// - You have a MySQL database with a 'users' table: id (INT, AUTO_INCREMENT, PRIMARY KEY), name (VARCHAR), email (VARCHAR, UNIQUE), password (VARCHAR).
// - Database connection is handled in '../config/database.js' exporting a mysql2 pool (e.g., const pool = mysql.createPool({...}); module.exports = pool;).
// - Install dependencies: npm install express mysql2 (and bcrypt for production password hashing).
// - In production, always hash passwords (e.g., using bcrypt) and add input validation (e.g., using Joi or express-validator).
// - These controllers handle basic operations: GET all users, GET by ID, POST create, PUT update, DELETE by ID.

const pool = require('../dbconnect');
const crypto = require('crypto');
const { S3Client,PutObjectCommand,ListBucketsCommand,S3ServiceException } = require("@aws-sdk/client-s3");
const { readFile } = require( "node:fs/promises");
const { Upload } = require("@aws-sdk/lib-storage");


    const r2 = new S3Client({
        region: "auto", // Or a specific region if required by your R2 setup
        endpoint: process.env.CloudFlare_endpoint,
        credentials: {
            accessKeyId: process.env.CloudFlare_accessKeyId,
            secretAccessKey: process.env.CloudFlare_secretAccessKey,
        },
    });



// Get all users
const getUsers = async (req, res) => {
 
  try {
          console.log("TEST DATA :");
          const result = await pool.execute("SELECT * FROM users")
          
              
                console.log(result); // result will contain the fetched data
                res.send(result);
            
             // res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

};

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
      

    const [rows] = await pool.execute(
            "SELECT * FROM users where id = ? ",[id]
        );
    
    console.log(rows[0]); // result will contain the fetched data
    res.send(rows[0]);
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new user
const createUser  = async (req, res) => {
  const { name, email, username,password,phone } = req.body;
  const userId = crypto.randomUUID();
  const currentDate = new Date();
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  try {
    // In production: const hashedPassword = await bcrypt.hash(password, 10);
      const sql = 'INSERT INTO `users`( `full_name`, `username`, `email`,`phone`, `password_hash`) VALUES (?,?,?,?,?)'
    con.query(sql,[name,username,email,phone,password], function (err, result, fields) {
      if (err) throw err;
      console.log(result); // result will contain the fetched data
      res.send('User registered successfully!');
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function generateVerificationCode() {
  // Generates a random integer between 100000 (inclusive) and 999999 (inclusive)
  return crypto.randomInt(100000, 999999); 
}

// Update user by ID
const updateUser  = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, username } = req.body;
  
  if (!first_name && !username && !last_name) {
    return res.status(400).json({ error: 'At least one field (name, email, or password) must be provided' });
  }
  try {
    // In production: if (password) { const hashedPassword = await bcrypt.hash(password, 10); }
    const updateFields = [];
    const values = [];
    let profile_pic = '';
    if (req.files)
    {
     
      const key = `images/${Date.now()}-${req.files[0].originalname}`
      const bucket = 'greyfundr'
      const body = req.files[0].buffer;
      const type = req.files[0].mimetype

      const saved = await saveimage(bucket,key,body);
      console.log(saved)
      profile_pic = key;

    }
    if (first_name) {
      updateFields.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name) {
      updateFields.push('last_name = ?');
      values.push(last_name);
    }
    if (username) {
      updateFields.push('username = ?');
      values.push(username); // Use hashedPassword in production
    }
    if(profile_pic)
    {
      updateFields.push('profile_pic = ?');
      values.push(profile_pic); // Use hashedPassword in production

    }
    
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    console.log(result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User  not found' });
    }
    res.status(200).json({ message: 'User  updated successfully', profile: profile_pic });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const saveimage = async (bucket, key, body ) => {
  
const upload = new Upload({
          client: r2,
          params: {
            Bucket: bucket,
            Key: key,
            Body: body, 
            
            // The readable stream
            // You can add other S3 PutObjectCommand parameters here, e.g., ContentType
            // ContentType: 'application/octet-stream',
          },
        });
      
        upload.on("httpUploadProgress", (progress) => {
          console.log(progress); // Log upload progress
        });
      
        try {
          const data = await upload.done();
          console.log("Upload successful:", data);
          return data;
        } catch (error) {
          console.error("Error uploading file:", error);
          throw error;
        }
  }

// Delete user by ID
const deleteUser  = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User  not found' });
    }
    res.status(200).json({ message: 'User  deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser ,
  updateUser ,
  deleteUser ,
};