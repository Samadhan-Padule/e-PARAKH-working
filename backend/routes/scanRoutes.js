const { upload } = require('../middleware/uploadMiddleware');
const express = require('express');

const {
    createScan,
    getScans,
    getScanById,
    deleteScan,
    getAIHealth
} = require('../controllers/scanController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

const router = express.Router();


/*
=========================================================
SCAN ROUTES
Base URL: /api/scans
=========================================================
*/


/*
---------------------------------------------------------
AI SERVICE HEALTH
GET /api/scans/ai-health
---------------------------------------------------------
*/
router.get(
    '/ai-health',
    authenticateToken,
    getAIHealth
);


/*
---------------------------------------------------------
CREATE / RUN SCAN
POST /api/scans
---------------------------------------------------------
*/
router.post(
    '/',
    authenticateToken,
    upload.single('image'),
    createScan
);

/*
---------------------------------------------------------
GET ALL SCANS
GET /api/scans
---------------------------------------------------------
*/
router.get(
    '/',
    authenticateToken,
    getScans
);


/*
---------------------------------------------------------
GET SINGLE SCAN
GET /api/scans/:id
---------------------------------------------------------
*/
router.get(
    '/:id',
    authenticateToken,
    getScanById
);


/*
---------------------------------------------------------
DELETE SCAN
DELETE /api/scans/:id
---------------------------------------------------------
*/
router.delete(
    '/:id',
    authenticateToken,
    deleteScan
);


module.exports = router;