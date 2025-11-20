// CampaignController.js
// This file contains all the basic CRUD controllers for Campaign management in a Node.js application using Express.js and MySQL (via mysql2 package).
// Assumptions:
// - You have a MySQL database with a 'Campaigns' table: id (INT, AUTO_INCREMENT, PRIMARY KEY), name (VARCHAR), email (VARCHAR, UNIQUE), password (VARCHAR).
// - Database connection is handled in '../config/database.js' exporting a mysql2 pool (e.g., const pool = mysql.createPool({...}); module.exports = pool;).
// - Install dependencies: npm install express mysql2 (and bcrypt for production password hashing).
// - In production, always hash passwords (e.g., using bcrypt) and add input validation (e.g., using Joi or express-validator).
// - These controllers handle basic operations: GET all Campaigns, GET by ID, POST create, PUT update, DELETE by ID.

const pool = require('../../dbconnect');
const crypto = require('crypto');
const Campaign = require('../../Models/campaigns')
const Notify = require('../Notifications/NotifyController')
const Host = require('../Host/HostController')



// Get all Campaigns
const getCampaigns = async (req, res) => {
  try {
           const con = await pool.getConnection();
           const sql = "SELECT * FROM campaigns"
           const result = await con.execute(sql);

           console.log(result); // result will contain the fetched data
                res.send(result);
          
             // res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching Campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Campaign by ID
const getCampaignById = async (req, res) => {

  const { id } = req.params;
  try {
    const con = await pool.getConnection();

    const [rows] = await pool.execute(
            "SELECT * FROM campaigns where id = ? ",[id]
        );
    
    console.log(rows[0]); // result will contain the fetched data
    res.send(rows[0]);
              
    
  } catch (error) {
    console.error('Error fetching Campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCampaignByName = async (req, res) => {

  const { name } = req.params;
  try {
    const con = await pool.getConnection();

    const [rows] = await pool.execute(
            "SELECT * FROM campaigns where title = ? ",[name]
        );
    
    console.log(rows[0]); // result will contain the fetched data
    res.send(rows[0]);
              
    
  } catch (error) {
    console.error('Error fetching Campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new Campaign
const createCampaign  = async (req, res) => {
  const con = await pool.getConnection();
  const { title, description,startDate,endDate,amount,id,stakeholders,images } = req.body;
  const form = endDate.split('/')
  const day = +form[0];
  const month = +form[1];
  const year = +form[2];
  const convert = new Date(year,month-1,day);

  stakeholder = JSON.parse(stakeholders);
  hosts = stakeholder.length;
  
  console.log(stakeholder);

  if (!title || !description || !id) {
    return res.status(400).json({ error: 'Title, Description, and Amount are required' });
  } 
  try {
    // In production: const hashedPassword = await bcrypt.hash(password, 10);
    
      const sql = "INSERT INTO `campaigns`( `creator_id`, `title`, `description`,`start_date`, `end_date`, `goal_amount`, `current_amount`,`approved`,`host`,`image`) VALUES (?,?,?,?,?,?,?,?,?,?)";
      const values = [id,title,description,new Date(startDate),convert,amount,0,false,hosts,images]
      const result = await con.execute(sql,values);
      
     
      
      const message = 'You were added as a host to a new campaign';
      const type = 'campaign'
       for (const product of stakeholder) {
        console.log(product.id);
        console.log(result[0].insertId);
        Host.createHost(product.id,result[0].insertId);
        Notify.createNotification(product.id,message,type,result[0].insertId);
    }
  
     
      
      res.status(200).json({ msg: 'Campaign Created successfully', id: result[0].insertId });
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating Campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Campaign by ID
const updateCampaign  = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  if (!name && !email && !password) {
    return res.status(400).json({ error: 'At least one field (name, email, or password) must be provided' });
  }
  try {
    // In production: if (password) { const hashedPassword = await bcrypt.hash(password, 10); }
    const updateFields = [];
    const values = [];
    if (name) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (email) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (password) {
      updateFields.push('password = ?');
      values.push(password); // Use hashedPassword in production
    }
    values.push(id);

    const [result] = await db.execute(
      `UPDATE campaigns SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign  not found' });
    }
    res.status(200).json({ message: 'Campaign  updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error updating Campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategory = async(req,res) =>
{
   try {
      // Check if user exists
      let campaign = await Campaign.getCategory();
      console.log(campaign);
      if (!campaign) {
        return res.status(400).json({ msg: 'No Categories' });
      }
  
      // Generate token
      const payload = { campaign};
      //const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ msg: 'Category Loaded', campaign });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
}

const stakeholderApproval = async(req,res) =>
{
  const { id } = req.params;

   try {
      // Check if user exists
      let campaign = await Campaign.stakeholderApproval(id);
      console.log(campaign);
      if (!campaign) {
        return res.status(400).json({ msg: 'No Categories' });
      }
  
      // Generate token
      const payload = {campaign};
      //const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ msg: 'Category Loaded', campaign });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
}

const getApprovalStatus = async(req,res) =>
{
  const { id } = req.params;
  console.log(id);
   try {
      // Check if user exists
      let campaign = await Campaign.getApproval(id);
      if (!campaign) {
        return res.status(400).json({ msg: 'No Categories' });
      }
  
      // Generate token
      const payload = {campaign};
      //const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ msg: 'Category Loaded', campaign });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
}

// Delete Campaign by ID
const deleteCampaign  = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM Campaigns WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign  not found' });
    }
    res.status(200).json({ message: 'Campaign  deleted successfully' });
  } catch (error) {
    console.error('Error deleting Campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign ,
  updateCampaign ,
  deleteCampaign ,
  getCampaignByName,
  getCategory,
  getApprovalStatus,
  stakeholderApproval,
};