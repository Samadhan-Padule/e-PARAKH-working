const mongoose = require('mongoose');
const Compliance = require('../models/Compliance');
const Inspection = require('../models/Inspection');
const Product = require('../models/Product');
const { validateProduct } = require('../services/complianceRuleEngine');

const complianceFields = [
	'overallStatus',
	'complianceScore',
	'declarationResults',
	'extractedDeclarations',
	'validationResults',
	'violations',
	'warnings',
	'readabilityAnalysis',
	'fontAnalysis',
	'evidenceReferences'
];

function isValidObjectId(value) {
	return mongoose.Types.ObjectId.isValid(value);
}

function getUserId(req, res) {
	const userId = req.user?.userId;
	if (!userId || !isValidObjectId(userId)) {
		res.status(401).json({ success: false, message: 'Invalid authenticated user.' });
		return null;
	}
	return userId;
}

async function createCompliance(req, res, next) {
	try {
		const officer = getUserId(req, res);
		if (!officer) return;
		const { product, inspection } = req.body;
		if (!product || !isValidObjectId(product)) return res.status(400).json({ success: false, message: 'A valid product ID is required.' });
		if (!inspection || !isValidObjectId(inspection)) return res.status(400).json({ success: false, message: 'A valid inspection ID is required.' });

		const productRecord = await Product.findOne({ _id: product, createdBy: officer }).lean();
		if (!productRecord) return res.status(404).json({ success: false, message: 'Product not found.' });
		const inspectionRecord = await Inspection.findOne({ _id: inspection, officer, product }).lean();
		if (!inspectionRecord) return res.status(404).json({ success: false, message: 'Inspection not found.' });

		const assessment = validateProduct(productRecord);
		const compliance = await Compliance.create({
			product,
			inspection,
			officer,
			overallStatus: assessment.status === 'PASS' ? 'COMPLIANT' : assessment.status === 'WARNING' ? 'WARNING' : 'NON_COMPLIANT',
			complianceScore: assessment.score,
			...assessment
		});
		return res.status(201).json({ success: true, message: 'Compliance assessment created successfully.', compliance });
	} catch (error) {
		return next(error);
	}
}

async function getCompliances(req, res, next) {
	try {
		const officer = getUserId(req, res);
		if (!officer) return;
		const compliances = await Compliance.find({ officer }).sort({ createdAt: -1 }).lean();
		return res.json({ success: true, count: compliances.length, compliances });
	} catch (error) { return next(error); }
}

async function getComplianceById(req, res, next) {
	try {
		const officer = getUserId(req, res);
		if (!officer) return;
		if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid compliance ID.' });
		const compliance = await Compliance.findOne({ _id: req.params.id, officer }).lean();
		if (!compliance) return res.status(404).json({ success: false, message: 'Compliance record not found.' });
		return res.json({ success: true, compliance });
	} catch (error) { return next(error); }
}

async function updateCompliance(req, res, next) {
	try {
		const officer = getUserId(req, res);
		if (!officer) return;
		if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid compliance ID.' });
		const updates = {};
		complianceFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
		const compliance = await Compliance.findOneAndUpdate({ _id: req.params.id, officer }, { $set: updates }, { new: true, runValidators: true }).lean();
		if (!compliance) return res.status(404).json({ success: false, message: 'Compliance record not found.' });
		return res.json({ success: true, message: 'Compliance assessment updated successfully.', compliance });
	} catch (error) { return next(error); }
}

async function deleteCompliance(req, res, next) {
	try {
		const officer = getUserId(req, res);
		if (!officer) return;
		if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid compliance ID.' });
		const compliance = await Compliance.findOneAndDelete({ _id: req.params.id, officer });
		if (!compliance) return res.status(404).json({ success: false, message: 'Compliance record not found.' });
		return res.json({ success: true, message: 'Compliance assessment deleted successfully.' });
	} catch (error) { return next(error); }
}

module.exports = { createCompliance, getCompliances, getComplianceById, updateCompliance, deleteCompliance };