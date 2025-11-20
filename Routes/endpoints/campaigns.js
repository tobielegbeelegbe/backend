const express = require('express');
const router = express.Router();
const con = require('../../dbconnect');
const {
  getCampaigns,
  getCampaignById,
  createCampaign ,
  updateCampaign ,
  deleteCampaign ,
  getCampaignByName ,
  getCategory,
  getApprovalStatus,
  stakeholderApproval,
} = require('../../Controllers/Campaign/CampaignController');



router.use(express.urlencoded({ extended: true }));

// Routes
router.get('/getall', getCampaigns);
router.get('/getCategory', getCategory);
router.get('/getcampaign/:id', getCampaignById);
router.get('/getApprovalStatus/:id', getApprovalStatus);
router.put('/stakeholderApproval/:id', stakeholderApproval);
router.get('/searchCampaign/:name', getCampaignByName);
router.post('/create', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/delete:id', deleteCampaign);



module.exports = router;