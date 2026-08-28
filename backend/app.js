const express = require('express');
const cors = require('cors');

const { corsOrigin } = require('./config/env');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const complianceRoutes = require('./routes/complianceRoutes');

const {
    notFoundHandler,
    errorHandler
} = require('./middleware/errorMiddleware');

const app = express();

/*
=========================================================
GLOBAL MIDDLEWARE
=========================================================
*/

// CORS
app.use(
    cors({
        origin: corsOrigin
    })
);

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(
    express.urlencoded({
        extended: true
    })
);


/*
=========================================================
API ROUTES
=========================================================
*/

// Health Check
// GET /api/health
app.use('/api/health', healthRoutes);


// Authentication
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me
app.use('/api/auth', authRoutes);


// Products
// POST   /api/products
// GET    /api/products
// GET    /api/products/:id
// PUT    /api/products/:id
// DELETE /api/products/:id
app.use('/api/products', productRoutes);


// Inspections
// POST   /api/inspections
// GET    /api/inspections
// GET    /api/inspections/:id
// PUT    /api/inspections/:id
// DELETE /api/inspections/:id
app.use('/api/inspections', inspectionRoutes);


// Compliance assessments
app.use('/api/compliance', complianceRoutes);


/*
=========================================================
404 HANDLER
=========================================================
*/

// Handles unknown API routes
app.use(notFoundHandler);


/*
=========================================================
GLOBAL ERROR HANDLER
=========================================================
*/

// Handles application errors
app.use(errorHandler);


/*
=========================================================
EXPORT APP
=========================================================
*/

module.exports = app;