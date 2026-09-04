const express = require('express');

const {
    register,
    login,
    me
} = require('../controllers/authController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

const router = express.Router();


// Inspector / Senior Officer / Admin registration
router.post(
    '/register',
    register
);


// Login
router.post(
    '/login',
    login
);


// Current logged-in user
router.get(
    '/me',
    authenticateToken,
    authorizeRole('INSPECTOR', 'SENIOR_OFFICER', 'ADMIN'),
    me
);


module.exports = router;