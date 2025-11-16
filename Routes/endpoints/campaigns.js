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
} = require('../../Controllers/Campaign/CampaignController');



router.use(express.urlencoded({ extended: true }));

// Routes
router.get('/getall', getCampaigns);
router.get('/getCategory', getCategory);
router.get('/getcampaign/:id', getCampaignById);
router.get('/searchCampaign/:name', getCampaignByName);
router.post('/create', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/delete:id', deleteCampaign);



module.exports = router;