const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDatabase() {
	try {
		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 5000
		});
		return true;
	} catch (error) {
		console.error(`MongoDB connection unavailable: ${error.message}`);
		throw error;
	}
}

function getDatabaseStatus() {
	return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = { connectDatabase, getDatabaseStatus };
