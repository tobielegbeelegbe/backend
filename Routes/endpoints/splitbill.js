const express = require('express');
const router = express.Router();

const {
  getSplitBill,
  
} = require('../../Controllers/SplitBill/SplitBillController');



router.use(express.urlencoded({ extended: true }));

// Routes
router.get('/getSplitBill/:id', getSplitBill);




module.exports = router;