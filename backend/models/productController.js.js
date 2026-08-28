const Product = require("../models/Product");

/*
=========================================================
CREATE PRODUCT
POST /api/products
=========================================================
*/
const createProduct = async (req, res) => {
    try {
        const {
            productName,
            manufacturer,
            brandName,
            netQuantity,
            mrp,
            packingDate,
            consumerCare,
            address,
            additionalDeclarations,
            productImage,
            source,
            aiConfidence
        } = req.body;

        // Basic validation
        if (!productName || !manufacturer) {
            return res.status(400).json({
                success: false,
                message: "Product name and manufacturer are required."
            });
        }

        // User must be authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const product = await Product.create({
            productName,
            manufacturer,
            brandName,
            netQuantity,
            mrp,
            packingDate,
            consumerCare,
            address,
            additionalDeclarations,
            productImage,
            source: source || "MANUAL",
            aiConfidence,
            createdBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product
        });

    } catch (error) {
        console.error("Create Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create product.",
            error: error.message
        });
    }
};


/*
=========================================================
GET ALL PRODUCTS
GET /api/products
=========================================================
*/
const getProducts = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const products = await Product.find({
            createdBy: req.user.id
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Get Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch products.",
            error: error.message
        });
    }
};


/*
=========================================================
GET SINGLE PRODUCT
GET /api/products/:id
=========================================================
*/
const getProductById = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        }).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        console.error("Get Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch product.",
            error: error.message
        });
    }
};


/*
=========================================================
UPDATE PRODUCT
PUT /api/products/:id
=========================================================
*/
const updateProduct = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const allowedFields = [
            "productName",
            "manufacturer",
            "brandName",
            "netQuantity",
            "mrp",
            "packingDate",
            "consumerCare",
            "address",
            "additionalDeclarations",
            "productImage",
            "source",
            "aiConfidence"
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                createdBy: req.user.id
            },
            {
                $set: updates
            },
            {
                new: true,
                runValidators: true
            }
        ).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            product
        });

    } catch (error) {
        console.error("Update Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update product.",
            error: error.message
        });
    }
};


/*
=========================================================
DELETE PRODUCT
DELETE /api/products/:id
=========================================================
*/
const deleteProduct = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const product = await Product.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully."
        });

    } catch (error) {
        console.error("Delete Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete product.",
            error: error.message
        });
    }
};


/*
=========================================================
EXPORTS
=========================================================
*/
module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};