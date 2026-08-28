const mongoose = require('mongoose');
const Inspection = require('../models/Inspection');
const Product = require('../models/Product');

const inspectionFields = [
	'product',
	'status',
	'complianceStatus',
	'complianceScore',
	'evidenceImages',
	'observations',
	'violations',
	'remarks',
	'inspectedAt'
];

function isValidObjectId(value) {
	return mongoose.Types.ObjectId.isValid(value);
}

function getUserId(req, res) {
	const userId = req.user?.userId;
	if (!userId || !isValidObjectId(userId)) {
		res.status(401).json({
			success: false,
			message: 'Invalid authenticated user.'
		});
		return null;
	}
	return userId;
}

async function createInspection(req, res, next) {
	try {
		const userId = getUserId(req, res);
		if (!userId) return;

		const { product } = req.body;
		if (!product) {
			return res.status(400).json({
				success: false,
				message: 'Product is required.'
			});
		}
		if (!isValidObjectId(product)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid product ID.'
			});
		}

		const productRecord = await Product.findOne({ _id: product, createdBy: userId }).lean();
		if (!productRecord) {
			return res.status(404).json({
				success: false,
				message: 'Product not found.'
			});
		}

		const inspectionData = { officer: userId };
		inspectionFields.forEach((field) => {
			if (req.body[field] !== undefined) inspectionData[field] = req.body[field];
		});

		const inspection = await Inspection.create(inspectionData);
		return res.status(201).json({
			success: true,
			message: 'Inspection created successfully.',
			inspection
		});
	} catch (error) {
		return next(error);
	}
}

async function getInspections(req, res, next) {
	try {
		const userId = getUserId(req, res);
		if (!userId) return;

		const inspections = await Inspection.find({ officer: userId })
			.sort({ createdAt: -1 })
			.lean();

		return res.json({
			success: true,
			count: inspections.length,
			inspections
		});
	} catch (error) {
		return next(error);
	}
}

async function getInspectionById(req, res, next) {
	try {
		const userId = getUserId(req, res);
		if (!userId) return;
		if (!isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid inspection ID.'
			});
		}

		const inspection = await Inspection.findOne({
			_id: req.params.id,
			officer: userId
		}).lean();

		if (!inspection) {
			return res.status(404).json({
				success: false,
				message: 'Inspection not found.'
			});
		}

		return res.json({ success: true, inspection });
	} catch (error) {
		return next(error);
	}
}

async function updateInspection(req, res, next) {
	try {
		const userId = getUserId(req, res);
		if (!userId) return;
		if (!isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid inspection ID.'
			});
		}

		const updates = {};
		inspectionFields.forEach((field) => {
			if (field !== 'product' && req.body[field] !== undefined) updates[field] = req.body[field];
		});

		if (req.body.product !== undefined) {
			if (!isValidObjectId(req.body.product)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid product ID.'
				});
			}

			const productRecord = await Product.findOne({
				_id: req.body.product,
				createdBy: userId
			}).lean();
			if (!productRecord) {
				return res.status(404).json({
					success: false,
					message: 'Product not found.'
				});
			}
			updates.product = req.body.product;
		}

		const inspection = await Inspection.findOneAndUpdate(
			{ _id: req.params.id, officer: userId },
			{ $set: updates },
			{ new: true, runValidators: true }
		).lean();

		if (!inspection) {
			return res.status(404).json({
				success: false,
				message: 'Inspection not found.'
			});
		}

		return res.json({
			success: true,
			message: 'Inspection updated successfully.',
			inspection
		});
	} catch (error) {
		return next(error);
	}
}

async function deleteInspection(req, res, next) {
	try {
		const userId = getUserId(req, res);
		if (!userId) return;
		if (!isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid inspection ID.'
			});
		}

		const inspection = await Inspection.findOneAndDelete({
			_id: req.params.id,
			officer: userId
		});

		if (!inspection) {
			return res.status(404).json({
				success: false,
				message: 'Inspection not found.'
			});
		}

		return res.json({
			success: true,
			message: 'Inspection deleted successfully.'
		});
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	createInspection,
	getInspections,
	getInspectionById,
	updateInspection,
	deleteInspection
};
