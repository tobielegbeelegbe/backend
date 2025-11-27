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


const { S3Client,PutObjectCommand,ListBucketsCommand,S3ServiceException } = require("@aws-sdk/client-s3");
const { readFile } = require( "node:fs/promises");
const { Upload } = require("@aws-sdk/lib-storage");

    const r2 = new S3Client({
        region: "auto", // Or a specific region if required by your R2 setup
        endpoint: `https://235e26cc351b50a91a8aa9d25f3e4a89.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: '1bb90867ae9f41ee5636a6012dd4a2ff',
            secretAccessKey: '81db0a29d90035565ca7e41d5694e9f6660d970213d82bd0689398c75d7c1d89',
        },
    });



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

  console.log(id);
  try {
    const con = await pool.getConnection();

    const [rows] = await pool.execute(
            "SELECT * FROM campaigns where id = ? ",[id]
        );

    const [donors] = await pool.execute(
            "SELECT * FROM donors where campaign_id = ? ",[id]
        );

    
    const payload = { campaigns: rows[0], donors: donors};
    
        res.status(200).json({ msg: "Logged in successfully", payload });
    
    console.log(rows[0]); // result will contain the fetched data
    console.log(donors);
    //res.send(rows[0]);
              
    
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

const viewDetails = async(req,res) =>
{

  img = [];

  if (req.files && Array.isArray(req.files)) {
  for (const file of req.files) {

      const key = `images/${Date.now()}-${file.originalname}`
      const bucket = 'greyfundr'
      const body = file.buffer;
      const type = file.mimetype
    // Process each file individually
    
    console.log(`Processing file: ${file.originalname}`);
    img.push(key);
    const saved = await saveimage(bucket,key,body);
    console.log(saved)
    // Example: move file, resize image, store data in database
    // fs.renameSync(file.path, `/new/destination/${file.filename}`);
  }
} else {
  console.log("No files uploaded or req.files is not an array.");
} 
console.log(img);  

  
}

const saveimage = async (bucket, key, body ) => {
const upload = new Upload({
          client: r2,
          params: {
            Bucket: bucket,
            Key: key,
            Body: body, // The readable stream
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

// Create a new Campaign
const createCampaign  = async (req, res) => {
  const con = await pool.getConnection();
  const { title, description,startDate,endDate,amount,id,stakeholders,images } = req.body;
  const form = endDate.split('/')
  const forms = startDate.split('/')

  const day = +form[0];
  const month = +form[1];
  const year = +form[2];

  const days = +forms[0];
  const months = +forms[1];
  const years = +forms[2];

  const convert = new Date(year,month-1,day);
  const converts = new Date(years,months-1,days);

  console.log(convert);
  console.log(converts);

  stakeholder = JSON.parse(stakeholders);
  hosts = stakeholder.length;
  
  console.log(stakeholder);

    if (!title || !description || !id) {
    return res.status(400).json({ error: 'Title, Description, and Amount are required' });
  } 

  img = [];

      if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {

          const key = `images/${Date.now()}-${file.originalname}`
          const bucket = 'greyfundr'
          const body = file.buffer;
          const type = file.mimetype
        // Process each file individually
        
        console.log(`Processing file: ${file.originalname}`);
        console.log(key);
        img.push(key);
        const saved = await saveimage(bucket,key,body);
        console.log(saved)
        // Example: move file, resize image, store data in database
        // fs.renameSync(file.path, `/new/destination/${file.filename}`);
      }
    } else {
      console.log("No files uploaded or req.files is not an array.");
    } 
    
   stringImages = img.join(',');
   console.log(stringImages);
  try {
    // In production: const hashedPassword = await bcrypt.hash(password, 10);
      console.log(id);
      console.log(title);
      console.log(amount);
      console.log(hosts);
      console.log(img[0]);
      const sql = "INSERT INTO `campaigns`( `creator_id`, `title`, `description`,`start_date`, `end_date`, `goal_amount`, `current_amount`,`approved`,`host`,`images`,`category`,`image`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
      const values = [id,title,description,converts,convert,amount,0,0,hosts,stringImages,'nature',img[0]]
      const result = await con.execute(sql,values);
      console.log(result);
     console.log(stringImages);
      
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
      return res.status(409).json({ msg: 'Email already exists'});
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
  viewDetails,
};