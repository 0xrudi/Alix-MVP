const express = require('express');
const { createOrUpdateUser, getUserData } = require('../src/controllers/userController');

const router = express.Router();

router.post('/', createOrUpdateUser);
router.get('/:userId', getUserData);

// Add more routes as needed

module.exports = router;