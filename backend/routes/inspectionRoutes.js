const express = require('express');

const {
    createInspection,
    getInspections,
    getInspectionById,
    updateInspection,
    deleteInspection
} = require('../controllers/inspectionController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/',
    authenticateToken,
    createInspection
);

router.get(
    '/',
    authenticateToken,
    getInspections
);

router.get(
    '/:id',
    authenticateToken,
    getInspectionById
);

router.put(
    '/:id',
    authenticateToken,
    updateInspection
);

router.delete(
    '/:id',
    authenticateToken,
    deleteInspection
);

module.exports = router;
