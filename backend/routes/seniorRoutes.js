const express = require('express');

const {
    getDashboard,
    getInspectors,
    getPendingRegistrations,
    approveInspector,
    rejectInspector,
    getSeniorInspections,
    getSeniorInspectionById
} = require('../controllers/seniorController');

const {
    authenticateToken,
    authorizeRole
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(
    authenticateToken,
    authorizeRole('SENIOR_OFFICER', 'ADMIN')
);

router.get('/dashboard', getDashboard);

router.get('/inspectors', getInspectors);

router.get('/inspectors/pending', getPendingRegistrations);

router.patch('/inspectors/:id/approve', approveInspector);

router.patch('/inspectors/:id/reject', rejectInspector);

router.get('/inspections', getSeniorInspections);

router.get('/inspections/:id', getSeniorInspectionById);

module.exports = router;