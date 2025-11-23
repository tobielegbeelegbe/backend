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

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

    

  try {
    // Check if user exists
    console.log(email);
  console.log(password);
  console.log('Not Found');
  
    let user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: "Invalid Email or Phone" });
    }

    console.log(user.id);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect Password" });
    }
    console.log(isMatch);
    let user_wallet = await Wallet.getUserWallet(user.id);

    console.log(user_wallet)

    // Generate token
    const payload = { user: user, wallet: user_wallet};
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(200).json({ msg: "Logged in successfully", token });
  } catch (err) {
    //console.error(err.message);
    res.status(500).send("Server error");
  }
};

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

exports.updateDetails = async (req, res) => {
  const { id, first_name, last_name, username, rUsername } = req.body;
  const currency = 'Naira';
  console.log(id);
  console.log(first_name);
  try {
    // Check if user exists
    let user = await User.updateDetails(
      id,
      first_name,
      last_name,
      username,
      rUsername
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
