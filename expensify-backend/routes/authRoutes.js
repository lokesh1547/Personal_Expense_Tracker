const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser, logout } = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/register
router.post('/register', registerUser);

// POST /api/login
router.post('/login', loginUser);

// POST /api/logout
router.post('/logout', logout);

// GET /api/user (protected)
router.get('/user', verifyToken, getUser);



module.exports = router;
