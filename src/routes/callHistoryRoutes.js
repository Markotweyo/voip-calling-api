const express = require('express');
const {
    getCallHistory,
    getCallDetails,
    getCallStats,
    deleteCall
} = require('../controllers/callHistoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getCallHistory);
router.get('/stats', getCallStats);
router.get('/:id', getCallDetails);
router.delete('/:id', deleteCall);

module.exports = router;