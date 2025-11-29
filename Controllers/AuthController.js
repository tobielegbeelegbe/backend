const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const con = require("../dbconnect");
const crypto = require("crypto");
const User = require("../Models/user");
const very = require("../Controllers/VerificationController");
const Wallet = require("../Controllers/Wallet/WalletController")

// Register a new user
exports.createUser = async (req, res) => {
  const { email, password, phone } = req.body;
  
  phones = '+234' + phone;
  console.log(phones);

  const code = generateVerificationCode();

  if (!phone || !email || !password) {
    return res
      .status(400)
      .json({ error: "Phone, email, and password are required" });
  }
  try {
    
    let test = await User.create(email, password, phones, code);
    

    if (test) {
      if (test) {
      
        console.log(code);
        very.sendWhatsapp(phones, code);
        res.json({ message: "Verification Code Sent to" + phones });
      }
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

function generateVerificationCode() {
  // Generates a random integer between 100000 (inclusive) and 999999 (inclusive)
  return crypto.randomInt(1000, 9999);
}


function generateAnonymus() {
  // Generates a random integer between 100000 (inclusive) and 999999 (inclusive)
  return crypto.randomInt(100000, 999999);
}

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

    if (!email ||  !password) {
      return res.status(400).json({ msg: "Invalid Email or Phone" });
    }

  try {
     
   
        await checkLogin(email,password).then(
      function(result) {
        console.log("Promise fulfilled with:", result);
        if(result)
        {

          const token = jwt.sign(result, process.env.JWT_SECRET, {
         expiresIn: "2h",
         });
        res.status(200).json({ msg: "Logged in successfully", token });

        }
        else
        {
          res.status(400).json({ msg: "Login Error"});
        }
        
      },
      function(error) {
        console.error("Promise rejected with:", error);
      }
    ); 
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const checkLogin = async(email,password) =>
{


  try{

  let user = await User.findByEmail(email);
    if (!user) {
      console.log("user Not FOund")
      return false
    }

    console.log(user.id); 

    // Compare passwords
     
      let userWallet =  await getUserWallet(user.id);
      let payload
      console.log(password)
      await checkPassword(password,user.password_hash).then(

      function(result) {
        if(result)
        {
           console.log("Promise fulfilled with:", result);
          payload = { user: user, wallet: userWallet};
        }

        else
        {
          payload = false;
        }
      },
      function(error) {
        console.error("Promise rejected with:", error);
        
      }
    );
      

      

      return payload
  }
  catch(error)
  {
    console.log(error)
  }

}


const checkPassword = async(password,lpassword) =>
{
     try
    {
    const isMatch = await bcrypt.compare(password, lpassword);
      if (!isMatch) {
        return false;
      }
      else
        return true;
    }
    catch(error)
    {
      console.log(error)
    }


}

const getUserWallet = async(user_id) =>
{
     try
    {
        let user_wallet = Wallet.getUserWallet(user_id);

        if(!user_wallet)
        {
          user_wallet = Wallet.createWallet(user_id,'Naira');
          return  "No User Wallet Found";
          
        }
        else
        return user_wallet;
    }
    catch(error)
    {
      console.log(error)
    }


}

exports.verify = async (req, res) => {
  const { code, email } = req.body;


  try {
    // Check if user exists
    let user = await User.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Phone" });
    }

    console.log(user.verify_code);
    console.log(code);
    if (user.verify_code == code) {
      User.updateVerify(user.id);
      res.status(200).json({ message: "Verified successfully", id: user.id });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};


exports.verifyPin = async (req, res) => {
  const { code, email } = req.body;


  try {
    // Check if user exists
    let user = await User.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid User" });
    }

    console.log(user.pin);
    console.log(code);
    if (user.pin == code) {
      
      res.status(200).json({ message: "Verified successfully", id: user.id });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.updateDetails = async (req, res) => {
  const { id, first_name, last_name, username } = req.body;
  const currency = 'Naira';
  console.log(id);
  console.log(first_name);
  const random = generateAnonymus();
  const rusername = 'Anonymus' + random;
  console.log(rusername);
  try {
    // Check if user exists
    let user = await User.updateDetails(
      id,
      first_name,
      last_name,
      username,
      rusername
    );

    
       let wallet = await Wallet.createWallet(id,currency);

       console.log(wallet);
    
    res.status(200).json({ message: "Updated successfully", id: user.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ msg: "Logged in successfully", token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getProfile = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ msg: "Logged in successfully", token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Other authentication-related functions can be added here
