const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT) || 5000,
	mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legal_metrology_compliance',
	corsOrigin: process.env.CORS_ORIGIN || '*',
	jwtSecret: process.env.JWT_SECRET,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};
