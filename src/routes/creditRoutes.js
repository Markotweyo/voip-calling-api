const express = require('express');
const {
    getBalance,
    getPackages,
    purchaseCredits,
    getTransactions
} = require('../controllers/creditController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/balance', getBalance);
router.get('/packages', getPackages);
router.post('/purchase', purchaseCredits);
router.get('/transactions', getTransactions);

module.exports = router;