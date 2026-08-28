function validateRegistration(input) {
	const fields = ['fullName', 'employeeId', 'department', 'designation', 'state', 'district', 'officeName', 'officialEmail', 'officialMobile', 'password'];
	const missing = fields.filter((field) => typeof input[field] !== 'string' || !input[field].trim());
	if (missing.length) return `Required fields are missing: ${missing.join(', ')}`;
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.officialEmail.trim())) return 'Enter a valid official email address.';
	if (!/^\d{10}$/.test(input.officialMobile.trim())) return 'Enter a valid 10-digit mobile number.';
	if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(input.password)) return 'Password must be at least 8 characters and include upper, lower, number, and special character.';
	return null;
}

function validateLogin(input) {
	const identifier = input.identifier ?? input.officialEmail ?? input.employeeId;
	if (typeof identifier !== 'string' || !identifier.trim() || typeof input.password !== 'string' || !input.password) return 'Official email or employee ID and password are required.';
	return null;
}

module.exports = { validateRegistration, validateLogin };
