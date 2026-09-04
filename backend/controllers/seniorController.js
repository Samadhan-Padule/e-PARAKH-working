const mongoose = require('mongoose');
const User = require('../models/User');
const Inspection = require('../models/Inspection');
const Product = require('../models/Product');

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
|--------------------------------------------------------------------------
| GET SENIOR DASHBOARD
|--------------------------------------------------------------------------
*/

async function getDashboard(req, res, next) {
    try {
        const seniorId = getUserId(req, res);
        if (!seniorId) return;

        const inspectors = await User.find({
            role: 'INSPECTOR',
            seniorOfficerId: seniorId
        })
            .select('-passwordHash')
            .lean();

        const inspectorIds = inspectors.map((inspector) => inspector._id);

        const [
            totalInspections,
            pendingInspections,
            nonCompliantInspections
        ] = await Promise.all([
            Inspection.countDocuments({
                officer: { $in: inspectorIds }
            }),

            Inspection.countDocuments({
                officer: { $in: inspectorIds },
                status: 'PENDING'
            }),

            Inspection.countDocuments({
                officer: { $in: inspectorIds },
                complianceStatus: 'NON_COMPLIANT'
            })
        ]);

        const pendingRegistrations = await User.countDocuments({
            role: 'INSPECTOR',
            status: 'PENDING',
            seniorOfficerId: null
        });

        return res.json({
            success: true,
            dashboard: {
                inspectors: inspectors.length,
                inspections: totalInspections,
                pendingInspections,
                nonCompliantInspections,
                pendingRegistrations
            }
        });
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET SENIOR'S INSPECTORS
|--------------------------------------------------------------------------
*/

async function getInspectors(req, res, next) {
    try {
        const seniorId = getUserId(req, res);
        if (!seniorId) return;

        const inspectors = await User.find({
            role: 'INSPECTOR',
            seniorOfficerId: seniorId
        })
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            count: inspectors.length,
            inspectors
        });
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET PENDING INSPECTOR REGISTRATIONS
|--------------------------------------------------------------------------
*/

async function getPendingRegistrations(req, res, next) {
    try {
        const pending = await User.find({
            role: 'INSPECTOR',
            status: 'PENDING',
            seniorOfficerId: null
        })
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            count: pending.length,
            inspectors: pending
        });
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| APPROVE INSPECTOR
|--------------------------------------------------------------------------
*/

async function approveInspector(req, res, next) {
    try {
        const seniorId = getUserId(req, res);
        if (!seniorId) return;

        const inspectorId = req.params.id;

        if (!isValidObjectId(inspectorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inspector ID.'
            });
        }

        const inspector = await User.findOneAndUpdate(
            {
                _id: inspectorId,
                role: 'INSPECTOR',
                status: 'PENDING',
                seniorOfficerId: null
            },
            {
                $set: {
                    status: 'ACTIVE',
                    seniorOfficerId: seniorId,
                    approvedAt: new Date()
                }
            },
            {
                new: true
            }
        )
            .select('-passwordHash')
            .lean();

        if (!inspector) {
            return res.status(404).json({
                success: false,
                message: 'Pending inspector registration not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Inspector approved successfully.',
            inspector
        });
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| REJECT INSPECTOR
|--------------------------------------------------------------------------
*/

async function rejectInspector(req, res, next) {
    try {
        const inspectorId = req.params.id;

        if (!isValidObjectId(inspectorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inspector ID.'
            });
        }

        const inspector = await User.findOneAndUpdate(
            {
                _id: inspectorId,
                role: 'INSPECTOR',
                status: 'PENDING',
                seniorOfficerId: null
            },
            {
                $set: {
                    status: 'REJECTED'
                }
            },
            {
                new: true
            }
        )
            .select('-passwordHash')
            .lean();

        if (!inspector) {
            return res.status(404).json({
                success: false,
                message: 'Pending inspector registration not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Inspector registration rejected.',
            inspector
        });
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET SENIOR'S INSPECTIONS
|--------------------------------------------------------------------------
*/

async function getSeniorInspections(req, res, next) {
    try {
        const seniorId = getUserId(req, res);
        if (!seniorId) return;

        const inspectors = await User.find({
            role: 'INSPECTOR',
            seniorOfficerId: seniorId
        })
            .select('_id fullName employeeId')
            .lean();

        const inspectorIds = inspectors.map((inspector) => inspector._id);

        const inspections = await Inspection.find({
            officer: { $in: inspectorIds }
        })
            .populate(
                'officer',
                'fullName employeeId department designation'
            )
            .populate(
                'product',
                'productName manufacturer brandName netQuantity mrp'
            )
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

/*
|--------------------------------------------------------------------------
| GET SINGLE INSPECTION
|--------------------------------------------------------------------------
*/

async function getSeniorInspectionById(req, res, next) {
    try {
        const seniorId = getUserId(req, res);
        if (!seniorId) return;

        const inspectionId = req.params.id;

        if (!isValidObjectId(inspectionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inspection ID.'
            });
        }

        const inspectors = await User.find({
            role: 'INSPECTOR',
            seniorOfficerId: seniorId
        })
            .select('_id')
            .lean();

        const inspectorIds = inspectors.map((inspector) => inspector._id);

        const inspection = await Inspection.findOne({
            _id: inspectionId,
            officer: { $in: inspectorIds }
        })
            .populate(
                'officer',
                'fullName employeeId department designation state district officeName officialEmail officialMobile'
            )
            .populate(
                'product',
                'productName manufacturer brandName netQuantity mrp packingDate consumerCare address additionalDeclarations productImage source aiConfidence'
            )
            .lean();

        if (!inspection) {
            return res.status(404).json({
                success: false,
                message: 'Inspection not found or access denied.'
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

module.exports = {
    getDashboard,
    getInspectors,
    getPendingRegistrations,
    approveInspector,
    rejectInspector,
    getSeniorInspections,
    getSeniorInspectionById
};