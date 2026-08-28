const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, authorizeRole('INSPECTOR', 'ADMIN'), me);

module.exports = router;