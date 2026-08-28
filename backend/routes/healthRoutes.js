const express = require('express');
const { getDatabaseStatus } = require('../config/db');

const router = express.Router();

router.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'Legal Metrology Compliance API is running',
		database: getDatabaseStatus()
	});
});

module.exports = router;
