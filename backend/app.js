const express = require('express');
const cors = require('cors');
const path = require('path');

const { corsOrigin } = require('./config/env');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const scanRoutes = require('./routes/scanRoutes');

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
FRONTEND STATIC FILES
=========================================================
*/

const frontendPath =
    path.join(__dirname, '..', 'frontend');

// Serve CSS, JS, assets, pages, images, etc.
app.use(
    express.static(frontendPath)
);


/*
=========================================================
API ROUTES
=========================================================
*/

// Health Check
// GET /api/health
app.use(
    '/api/health',
    healthRoutes
);

// Authentication
app.use(
    '/api/auth',
    authRoutes
);

// Products
app.use(
    '/api/products',
    productRoutes
);

// Inspections
app.use(
    '/api/inspections',
    inspectionRoutes
);

// Compliance
app.use(
    '/api/compliance',
    complianceRoutes
);

// Scans / AI
app.use(
    '/api/scans',
    scanRoutes
);


/*
=========================================================
FRONTEND ENTRY POINT
=========================================================
*/

// GET /
app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            'index.html'
        )
    );

});


/*
=========================================================
404 HANDLER
=========================================================
*/

app.use(
    notFoundHandler
);


/*
=========================================================
GLOBAL ERROR HANDLER
=========================================================
*/

app.use(
    errorHandler
);


/*
=========================================================
EXPORT APP
=========================================================
*/

module.exports = app;