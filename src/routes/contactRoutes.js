const express = require('express');
const { getContacts, createContact, deleteContact } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getContacts)
    .post(createContact);

router.delete('/:id', deleteContact);

module.exports = router;