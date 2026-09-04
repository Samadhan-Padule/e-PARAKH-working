const express = require('express');

const {
	createInspection,
	getInspections,
	getInspectionByInspectionId,
	getInspectionById,
	updateInspection,
	deleteInspection
} = require('../controllers/inspectionController');

const {
	authenticateToken
} = require('../middleware/authMiddleware');

const router = express.Router();


/*
=========================================================
CREATE
POST /api/inspections
=========================================================
*/

router.post(
	'/',
	authenticateToken,
	createInspection
);


/*
=========================================================
GET ALL — INSPECTOR'S OWN INSPECTIONS
GET /api/inspections
=========================================================
*/

router.get(
	'/',
	authenticateToken,
	getInspections
);


/*
=========================================================
GET BY HUMAN INSPECTION ID
GET /api/inspections/by-id/:inspectionId

IMPORTANT:
This MUST come before /:id
=========================================================
*/

router.get(
	'/by-id/:inspectionId',
	authenticateToken,
	getInspectionByInspectionId
);


/*
=========================================================
GET BY MONGODB _id
GET /api/inspections/:id
=========================================================
*/

router.get(
	'/:id',
	authenticateToken,
	getInspectionById
);


/*
=========================================================
UPDATE
PUT /api/inspections/:id
=========================================================
*/

router.put(
	'/:id',
	authenticateToken,
	updateInspection
);


/*
=========================================================
DELETE
DELETE /api/inspections/:id
=========================================================
*/

router.delete(
	'/:id',
	authenticateToken,
	deleteInspection
);


module.exports = router;