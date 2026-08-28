const express = require('express');

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const {
    authenticateToken
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
=========================================================
PRODUCT ROUTES
Base URL: /api/products
=========================================================
*/

/*
---------------------------------------------------------
CREATE PRODUCT
POST /api/products
---------------------------------------------------------
*/
router.post(
    '/',
    authenticateToken,
    createProduct
);


/*
---------------------------------------------------------
GET ALL PRODUCTS
GET /api/products
---------------------------------------------------------
*/
router.get(
    '/',
    authenticateToken,
    getProducts
);


/*
---------------------------------------------------------
GET SINGLE PRODUCT
GET /api/products/:id
---------------------------------------------------------
*/
router.get(
    '/:id',
    authenticateToken,
    getProductById
);


/*
---------------------------------------------------------
UPDATE PRODUCT
PUT /api/products/:id
---------------------------------------------------------
*/
router.put(
    '/:id',
    authenticateToken,
    updateProduct
);


/*
---------------------------------------------------------
DELETE PRODUCT
DELETE /api/products/:id
---------------------------------------------------------
*/
router.delete(
    '/:id',
    authenticateToken,
    deleteProduct
);


module.exports = router;