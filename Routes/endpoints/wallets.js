const express = require('express');
const router = express.Router();
const con = require('../../dbconnect');
const {
  getWallet,
  getWallets,
  createWallet ,
  addFunds ,
  deleteWallet ,
  removeFunds,
} = require('../../Controllers/Wallet/WalletController');



router.use(express.urlencoded({ extended: true }));

// Routes
router.get('/', getWallets);
router.get('/getWallet:id', getWallet);
router.post('/create', createWallet);
router.put('/addFunds:id', addFunds);
router.put('/removeFunds:id', removeFunds);
router.delete('/:id', deleteWallet);



module.exports = router;