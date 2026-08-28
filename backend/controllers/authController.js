const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { validateRegistration, validateLogin } = require('../validators/authValidator');

function issueToken(user) {
	if (!jwtSecret) throw Object.assign(new Error('JWT_SECRET is not configured'), { statusCode: 500 });
	return jwt.sign({ userId: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function register(req, res, next) {
	try {
		const validationError = validateRegistration(req.body);
		if (validationError) return res.status(400).json({ success: false, message: validationError });
		const textFields = ['fullName', 'department', 'designation', 'state', 'district', 'officeName'];
		const normalizedFields = Object.fromEntries(textFields.map((field) => [field, req.body[field].trim()]));
		const officialEmail = req.body.officialEmail.trim().toLowerCase();
		const employeeId = req.body.employeeId.trim().toUpperCase();
		const officialMobile = req.body.officialMobile.trim();
		const duplicate = await User.findOne({ $or: [{ officialEmail }, { employeeId }] }).select('officialEmail employeeId');
		if (duplicate) return res.status(409).json({ success: false, message: duplicate.officialEmail === officialEmail ? 'An account with this official email already exists.' : 'An account with this employee ID already exists.' });
		const passwordHash = await bcrypt.hash(req.body.password, 12);
		try {
			await User.create({ ...normalizedFields, employeeId, officialEmail, officialMobile, passwordHash, role: 'INSPECTOR', status: 'PENDING' });
		} catch (error) {
			if (error.code === 11000) {
				const duplicateField = Object.keys(error.keyPattern || {})[0];
				const message = duplicateField === 'officialEmail' ? 'An account with this official email already exists.' : 'An account with this employee ID already exists.';
				return res.status(409).json({ success: false, message });
			}
			throw error;
		}
		return res.status(201).json({ success: true, message: 'Inspector registration submitted successfully. Your account is pending approval.' });
	} catch (error) { return next(error); }
}

async function login(req, res, next) {
	try {
		const validationError = validateLogin(req.body);
		if (validationError) return res.status(400).json({ success: false, message: validationError });
		const identifier = (req.body.identifier ?? req.body.officialEmail ?? req.body.employeeId).trim();
		const user = await User.findOne({
			$or: [
				{ officialEmail: identifier.toLowerCase() },
				{ employeeId: identifier.toUpperCase() }
			]
		}).select('+passwordHash');
		if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ success: false, message: 'Invalid official email or password.' });
		if (user.status === 'PENDING') return res.status(403).json({ success: false, message: 'Your account is pending administrator approval.' });
		if (user.status === 'REJECTED') return res.status(403).json({ success: false, message: 'Your account registration was rejected.' });
		if (user.status === 'SUSPENDED') return res.status(403).json({ success: false, message: 'Your account is suspended.' });
		return res.json({ success: true, message: 'Login successful.', token: issueToken(user), inspector: user.toSafeObject() });
	} catch (error) { return next(error); }
}

async function me(req, res, next) {
	try {
		const user = await User.findById(req.user.userId);
		if (!user || user.status !== 'ACTIVE') return res.status(401).json({ success: false, message: 'Inspector account is no longer active.' });
		return res.json({ success: true, inspector: user.toSafeObject() });
	} catch (error) { return next(error); }
}

module.exports = { register, login, me };