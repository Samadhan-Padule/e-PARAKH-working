const mongoose = require('mongoose');

const declarationResultSchema = new mongoose.Schema(
	{
		field: { type: String, required: true, trim: true },
		detected: { type: Boolean, default: false },
		extractedValue: { type: String, default: '' },
		required: { type: Boolean, default: true },
		expected: { type: String, default: '' },
		valid: { type: Boolean, default: false },
		status: { type: String, enum: ['PASS', 'WARNING', 'FAIL'], required: true },
		issue: { type: String, default: '' },
		confidence: { type: Number, min: 0, max: 1, default: null }
	},
	{ _id: false }
);

const violationSchema = new mongoose.Schema(
	{
		rule: { type: String, trim: true, default: '' },
		category: { type: String, trim: true, default: '' },
		field: { type: String, trim: true, default: '' },
		severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
		message: { type: String, required: true, trim: true },
		detectedValue: { type: String, default: '' },
		expectedValue: { type: String, default: '' },
		evidenceReference: { type: String, default: '' }
	},
	{ _id: false }
);

const complianceSchema = new mongoose.Schema(
	{
		product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
		inspection: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
		officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		overallStatus: {
			type: String,
			enum: ['PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'WARNING'],
			default: 'PENDING'
		},
		complianceScore: { type: Number, min: 0, max: 100, default: null },
		declarationResults: { type: [declarationResultSchema], default: [] },
		extractedDeclarations: { type: mongoose.Schema.Types.Mixed, default: {} },
		validationResults: { type: mongoose.Schema.Types.Mixed, default: {} },
		violations: { type: [violationSchema], default: [] },
		warnings: { type: [String], default: [] },
		readabilityAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
		fontAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
		evidenceReferences: { type: [String], default: [] }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Compliance', complianceSchema);