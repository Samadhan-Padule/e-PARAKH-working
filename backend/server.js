const app = require('./app');
const { connectDatabase } = require('./config/db');
const { port } = require('./config/env');

async function startServer() {
	await connectDatabase();

	app.listen(port, () => {
		console.log(`Legal Metrology Compliance API listening on port ${port}`);
	});
}

startServer().catch((error) => {
	console.error(`Unable to start the API: ${error.message}`);
	process.exitCode = 1;
});
