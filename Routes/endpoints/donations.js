const express = require('express');
const router = express.Router();
const con = require('../../dbconnect');
const {
  getDonors,
  getDonorById,
  createDonor ,
  getDonorByCampaign ,
  deleteDonor ,
} = require('../../Controllers/Donations/DonateController');
const { verifyToken } = require("../../middleware/auth");



router.use(express.urlencoded({ extended: true }));

// Routes
router.get('/', getDonors);
router.get('/getCampaignDonor/:id', getDonorByCampaign);
router.get('/getDonor/:id', getDonorById);
router.post('/createDonor', createDonor);
router.delete('/deleteDonor:id', deleteDonor);



module.exports = router;