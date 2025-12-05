const express = require('express');
const multer = require('multer');
const router = express.Router();

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
  viewDetails,
} = require('../../Controllers/Campaign/CampaignController');

const {
  uploadBudget,
} = require('../../Controllers/User/CloudflareR2Controller');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.use(express.urlencoded({ extended: true }));

// Routes
router.get('/getall', getCampaigns);
router.post('/saveImage',upload.array('image',10), viewDetails);
router.get('/getCategory', getCategory);
router.get('/getcampaign/:id', getCampaignById);
router.get('/getApprovalStatus/:id', getApprovalStatus);
router.put('/stakeholderApproval/:id', stakeholderApproval);
router.post('/uploadBudget',upload.array('image',10), uploadBudget);
router.get('/searchCampaign/:name', getCampaignByName);
router.post('/create', upload.array('image',10), createCampaign);
router.put('/:id', updateCampaign);
router.delete('/delete:id', deleteCampaign);



module.exports = router;