const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const con = require('../dbconnect');
const crypto = require('crypto');
const User = require('../Models/user')
const very = require('../Controllers/VerificationController')

// Register a new user
exports.createUser  = async (req, res) => {
  const { name, email, username,password,phone } = req.body;
  console.log(email)
  
  const code = generateVerificationCode();
  
  if (!phone || !email || !password) {
    return res.status(400).json({ error: 'Phone, email, and password are required' });
  }
  try {
     console.log(phone)
      let test = await User.create(email,password,phone,code);

      if(test)
      {

        if(test)
        {  
          console.log(code);   
          very.sendWhatsapp(phone,code)
          res.json({ message: 'Verification Code Sent to' + phone});
        
        }

      }
      
      
      
    
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry found:', err.sqlMessage);
      return res.status(409).json({ error: 'Email already exists' });
      
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
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
    let user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Email or Phone' });
    }

    console.log(user);


    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect Password' });
    }

   

    // Generate token
    const payload = { user: user };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ msg: 'Logged in successfully', token });
  } catch (err) {
    //console.error(err.message);
    res.status(500).send('Server error');
  }
};


exports.verify = async (req, res) => {
  const { code, email } = req.body;

  console.log(code) ;
  console.log(email) ;
  try {
    // Check if user exists
    let user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid Email or Phone' });
    }

    console.log(user.verify_code);
    console.log(code);
    if(user.verify_code == code)
    {
       User.updateVerify(user.id)
       res.status(200).json({ message: 'Verified successfully', id: user.id });
    }

   
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateDetails = async (req, res) => {
  const { id,first_name,last_name,username,rUsername } = req.body;

  console.log(id) ;
  console.log(first_name) ;
  try {
    // Check if user exists
    let user = await User.updateDetails(id,first_name,last_name,username ,rUsername);
    

       res.status(200).json({ message: 'Updated successfully', id: user.id });
    

   
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ msg: 'Logged in successfully', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProfile = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ msg: 'Logged in successfully', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Other authentication-related functions can be added here