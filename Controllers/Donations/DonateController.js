// DonorController.js
// This file contains all the basic CRUD controllers for Donor management in a Node.js application using Express.js and MySQL (via mysql2 package).
// Assumptions:
// - You have a MySQL database with a 'Donors' table: id (INT, AUTO_INCREMENT, PRIMARY KEY), name (VARCHAR), email (VARCHAR, UNIQUE), password (VARCHAR).
// - Database connection is handled in '../config/database.js' exporting a mysql2 pool (e.g., const pool = mysql.createPool({...}); module.exports = pool;).
// - Install dependencies: npm install express mysql2 (and bcrypt for production password hashing).
// - In production, always hash passwords (e.g., using bcrypt) and add input validation (e.g., using Joi or express-validator).
// - These controllers handle basic operations: GET all Donors, GET by ID, POST create, PUT update, DELETE by ID.

const pool = require('../../dbconnect');
const crypto = require('crypto');
const User = require("../../Models/user");
const Backer = require("../../Models/backers")
const Donation = require("../../Models/donation")
const Campaign = require("../../Models/campaigns")
const Wallet = require("../../Models/wallet")


// Get all Donors
const getDonors = async (req, res) => {
  const con = await pool.getConnection();
  try {
          console.log("TEST DATA :");
          const result = await con.execute("SELECT * FROM donors")
          
              
                console.log(result[0]); // result will contain the fetched data
                res.send(result[0]);
            
             // res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching Donors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  finally
  {
    con.release();
  }
};

// Get Donor by ID
const getDonorById = async (req, res) => {
  const { id } = req.params;
  try {
      
        const con = await pool.getConnection();

    const [rows] = await pool.execute(
            "SELECT * FROM donors where id = ? ",[id]
        );
    
    console.log(rows[0]); // result will contain the fetched data
    res.send(rows[0]);
    
  } catch (error) {
    console.error('Error fetching Donor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const getDonorByCampaign = async (req, res) => {
  const { id } = req.params;
  try {
      
        const con = await pool.getConnection();

    const [rows] = await pool.execute(
            "SELECT * FROM donors where id = ? ",[id]
        );
    
    console.log(rows[0]); // result will contain the fetched data
    res.send(rows[0]);
    
  } catch (error) {
    console.error('Error fetching Donor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Create a new Donor
const createDonor = async (req, res) => {
  const { amount, creator_id, user_id, campaign_id } = req.body;

  const type = 'wallet';
  const stat = '1';
  let user;

  try
  {

    user = await User.findById(user_id);
    console.log(user.first_name);

  }
  catch(error)
  {

  }


  if (!creator_id || !user_id || !campaign_id) {
    return res
      .status(400)
      .json({ error: "Phone, email, and password are required" });
  }
  try {
    
    let test = await Donation.create(user_id, campaign_id, amount, type, stat, user.first_name);
    

   
      if (test) {
      
        console.log(test);

        let backer = await Backer.create(user_id, campaign_id, amount, creator_id);
    
        if(backer)
        {

            let campaign = await updatAmount(campaign_id, amount);
            if(campaign)
            {
                
                let wallet = Wallet.minusWalletBalance(user_id,amount);
                let campaignwallet = Wallet.addWalletBalance(creator_id,amount);
                
                if(wallet && campaignwallet)
                {
                   res.status(200).json({ msg: "Donation is successfully"});
                }
            }
    

        }
        //very.sendWhatsapp(phones, code);
        //res.json({ message: "Verification Code Sent to" + phones });
      }
    
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.error("Duplicate entry found:", err.sqlMessage);
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatAmount = async (id,debit) =>
{
    const con = await pool.getConnection();
    try{

    

  const [result] = await con.execute(
    'UPDATE campaigns SET current_amount = current_amount + ? WHERE id = ?',
                [debit,debit, id]           
  );
  return result;
}
catch(error)
{
    console.error("Error creating user:", error);
}
finally
  {
    con.release();
  }
}


function generateVerificationCode() {
  // Generates a random integer between 100000 (inclusive) and 999999 (inclusive)
  return crypto.randomInt(100000, 999999); 
}


// Delete Donor by ID
const deleteDonor  = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM donor WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Donor  not found' });
    }
    res.status(200).json({ message: 'Donor  deleted successfully' });
  } catch (error) {
    console.error('Error deleting Donor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDonors,
  getDonorById,
  createDonor ,
  deleteDonor ,
  getDonorByCampaign,
};