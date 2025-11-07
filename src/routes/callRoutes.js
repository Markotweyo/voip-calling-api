const express = require('express');
const { getToken, initiateCall, endCall, getRates } = require('../controllers/callController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/token', getToken);
router.post('/initiate', initiateCall);
router.post('/:id/end', endCall);
router.get('/rates', getRates);

module.exports = router;