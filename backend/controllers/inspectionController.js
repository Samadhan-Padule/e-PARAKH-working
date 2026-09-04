const mongoose = require('mongoose');
const Inspection = require('../models/Inspection');
const Product = require('../models/Product');
const User = require('../models/User');

const inspectionFields = [
	'inspectionId',
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


/*
=========================================================
CREATE INSPECTION
POST /api/inspections

IMPORTANT:
- Inspector creates the inspection.
- Senior Officer is automatically taken from
  the logged-in Inspector's seniorOfficerId.
- Compliance values are stored only.
- This controller does NOT calculate compliance.
=========================================================
*/

async function createInspection(req, res, next) {
	try {
		const userId = getUserId(req, res);

		if (!userId) return;


		/*
		-----------------------------------------------------
		GET AUTHENTICATED INSPECTOR
		-----------------------------------------------------
		*/

		const inspector = await User.findById(userId).lean();

		if (!inspector) {
			return res.status(404).json({
				success: false,
				message: 'Inspector account not found.'
			});
		}


		/*
		-----------------------------------------------------
		ONLY INSPECTORS CAN CREATE INSPECTIONS
		-----------------------------------------------------
		*/

		if (inspector.role !== 'INSPECTOR') {
			return res.status(403).json({
				success: false,
				message: 'Only inspectors can create inspections.'
			});
		}


		/*
		-----------------------------------------------------
		SENIOR OFFICER ASSIGNMENT
		-----------------------------------------------------
		*/

		if (!inspector.seniorOfficerId) {
			return res.status(400).json({
				success: false,
				message:
					'No Senior Officer is assigned to this Inspector account. Please contact the administrator.'
			});
		}


		const seniorOfficer = await User.findOne({
			_id: inspector.seniorOfficerId,
			role: 'SENIOR_OFFICER',
			status: 'ACTIVE'
		}).lean();


		if (!seniorOfficer) {
			return res.status(400).json({
				success: false,
				message:
					'Assigned Senior Officer is not available or active.'
			});
		}


		/*
		-----------------------------------------------------
		INSPECTION ID
		-----------------------------------------------------
		*/

		const inspectionId =
			String(req.body.inspectionId || '')
				.trim()
				.toUpperCase();


		if (!inspectionId) {
			return res.status(400).json({
				success: false,
				message: 'Inspection ID is required.'
			});
		}


		/*
		-----------------------------------------------------
		PRODUCT
		-----------------------------------------------------
		*/

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


		/*
		-----------------------------------------------------
		PRODUCT OWNERSHIP
		-----------------------------------------------------
		*/

		const productRecord =
			await Product.findOne({
				_id: product,
				createdBy: userId
			}).lean();


		if (!productRecord) {
			return res.status(404).json({
				success: false,
				message: 'Product not found.'
			});
		}


		/*
		-----------------------------------------------------
		PREVENT DUPLICATE HUMAN-READABLE ID
		-----------------------------------------------------
		*/

		const existingInspection =
			await Inspection.findOne({
				inspectionId
			}).lean();


		if (existingInspection) {
			return res.status(409).json({
				success: false,
				message: 'Inspection ID already exists.'
			});
		}


		/*
		-----------------------------------------------------
		BUILD INSPECTION
		-----------------------------------------------------
		*/

		const inspectionData = {

			inspectionId,

			officer: userId,

			seniorOfficer:
				inspector.seniorOfficerId

		};


		inspectionFields.forEach((field) => {

			if (
				field === 'inspectionId'
			) {
				return;
			}

			if (
				req.body[field] !== undefined
			) {
				inspectionData[field] =
					req.body[field];
			}

		});


		/*
		-----------------------------------------------------
		CREATE
		-----------------------------------------------------
		*/

		const inspection =
			await Inspection.create(
				inspectionData
			);


		return res.status(201).json({
			success: true,
			message: 'Inspection report saved successfully.',
			inspection
		});


	} catch (error) {
		return next(error);
	}
}


/*
=========================================================
GET INSPECTOR'S INSPECTIONS
GET /api/inspections

Inspector sees ONLY their own records.
=========================================================
*/

async function getInspections(req, res, next) {
	try {
		const userId = getUserId(req, res);

		if (!userId) return;


		const inspections =
			await Inspection.find({
				officer: userId
			})
				.populate(
					'product',
					'productName manufacturer brandName netQuantity mrp packingDate consumerCare address'
				)
				.sort({
					createdAt: -1
				})
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


/*
=========================================================
GET INSPECTION BY HUMAN-READABLE INSPECTION ID
GET /api/inspections/by-id/:inspectionId

Example:
GET /api/inspections/by-id/EP-2026-483721
=========================================================
*/

async function getInspectionByInspectionId(
	req,
	res,
	next
) {
	try {
		const userId = getUserId(req, res);

		if (!userId) return;


		const inspectionId =
			String(
				req.params.inspectionId || ''
			)
				.trim()
				.toUpperCase();


		if (!inspectionId) {
			return res.status(400).json({
				success: false,
				message: 'Inspection ID is required.'
			});
		}


		const inspection =
			await Inspection.findOne({
				inspectionId,
				officer: userId
			})
				.populate(
					'product'
				)
				.populate(
					'officer',
					'name fullName employeeId officialEmail role'
				)
				.lean();


		if (!inspection) {
			return res.status(404).json({
				success: false,
				message:
					'Inspection not found or does not belong to your account.'
			});
		}


		return res.json({
			success: true,
			inspection
		});


	} catch (error) {
		return next(error);
	}
}


/*
=========================================================
GET INSPECTION BY MONGODB _id
GET /api/inspections/:id

Kept for existing functionality.
=========================================================
*/

async function getInspectionById(req, res, next) {
	try {
		const userId = getUserId(req, res);

		if (!userId) return;


		if (!isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid inspection database ID.'
			});
		}


		const inspection =
			await Inspection.findOne({
				_id: req.params.id,
				officer: userId
			})
				.populate('product')
				.lean();


		if (!inspection) {
			return res.status(404).json({
				success: false,
				message: 'Inspection not found.'
			});
		}


		return res.json({
			success: true,
			inspection
		});


	} catch (error) {
		return next(error);
	}
}


/*
=========================================================
UPDATE INSPECTION
=========================================================

IMPORTANT:
Inspector can update their own record.

inspectionId and seniorOfficer are NOT editable.
They are controlled by the system.
=========================================================
*/

async function updateInspection(req, res, next) {
	try {
		const userId = getUserId(req, res);

		if (!userId) return;


		if (!isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid inspection database ID.'
			});
		}


		const updates = {};


		inspectionFields.forEach((field) => {

			/*
			 * System-controlled fields.
			 */
			if (
				field === 'inspectionId'
			) {
				return;
			}

			if (
				req.body[field] !== undefined
			) {
				updates[field] =
					req.body[field];
			}

		});


		/*
		-----------------------------------------------------
		PRODUCT UPDATE
		-----------------------------------------------------
		*/

		if (
			req.body.product !== undefined
		) {

			if (
				!isValidObjectId(
					req.body.product
				)
			) {
				return res.status(400).json({
					success: false,
					message: 'Invalid product ID.'
				});
			}


			const productRecord =
				await Product.findOne({
					_id: req.body.product,
					createdBy: userId
				}).lean();


			if (!productRecord) {
				return res.status(404).json({
					success: false,
					message: 'Product not found.'
				});
			}


			updates.product =
				req.body.product;
		}


		/*
		-----------------------------------------------------
		SYSTEM CONTROLLED SENIOR OFFICER
		-----------------------------------------------------
		*/

		delete updates.seniorOfficer;


		/*
		-----------------------------------------------------
		UPDATE
		-----------------------------------------------------
		*/

		const inspection =
			await Inspection.findOneAndUpdate(
				{
					_id: req.params.id,
					officer: userId
				},
				{
					$set: updates
				},
				{
					new: true,
					runValidators: true
				}
			)
				.populate('product')
				.lean();


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


/*
=========================================================
DELETE INSPECTION
=========================================================
*/

async function deleteInspection(req, res, next) {
	try {
		const userId = getUserId(req, res);

		if (!userId) return;


		if (!isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid inspection database ID.'
			});
		}


		const inspection =
			await Inspection.findOneAndDelete({
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
	getInspectionByInspectionId,
	getInspectionById,
	updateInspection,
	deleteInspection
};