const express = require('express');
const {
	createCompliance,
	getCompliances,
	getComplianceById,
	updateCompliance,
	deleteCompliance
} = require('../controllers/complianceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticateToken, createCompliance);
router.get('/', authenticateToken, getCompliances);
router.get('/:id', authenticateToken, getComplianceById);
router.put('/:id', authenticateToken, updateCompliance);
router.delete('/:id', authenticateToken, deleteCompliance);

module.exports = router;