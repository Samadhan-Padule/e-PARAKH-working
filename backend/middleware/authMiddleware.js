const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function authenticateToken(req, res, next) {
	const header = req.get('authorization');
	if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Authentication token is required.' });
	if (!jwtSecret) return res.status(500).json({ success: false, message: 'Authentication is not configured.' });
	try {
		req.user = jwt.verify(header.slice(7).trim(), jwtSecret);
		return next();
	} catch (error) {
		return res.status(401).json({ success: false, message: error.name === 'TokenExpiredError' ? 'Authentication token has expired.' : 'Invalid authentication token.' });
	}
}

function authorizeRole(...roles) {
	return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ success: false, message: 'You are not authorized to access this resource.' });
}

module.exports = { authenticateToken, authorizeRole };