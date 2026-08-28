const Product = require('../models/Product');

const productFields = [
	'productName',
	'manufacturer',
	'brandName',
	'netQuantity',
	'mrp',
	'packingDate',
	'consumerCare',
	'address',
	'additionalDeclarations',
	'productImage',
	'source',
	'aiConfidence'
];

async function createProduct(req, res, next) {
	try {
		const { productName, manufacturer } = req.body;
		if (!productName || !manufacturer) {
			return res.status(400).json({
				success: false,
				message: 'Product name and manufacturer are required.'
			});
		}

		const product = await Product.create({
			...req.body,
			createdBy: req.user.userId
		});

		return res.status(201).json({
			success: true,
			message: 'Product created successfully.',
			product
		});
	} catch (error) {
		return next(error);
	}
}

async function getProducts(req, res, next) {
	try {
		const products = await Product.find({ createdBy: req.user.userId })
			.sort({ createdAt: -1 })
			.lean();

		return res.json({
			success: true,
			count: products.length,
			products
		});
	} catch (error) {
		return next(error);
	}
}

async function getProductById(req, res, next) {
	try {
		const product = await Product.findOne({
			_id: req.params.id,
			createdBy: req.user.userId
		}).lean();

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found.'
			});
		}

		return res.json({ success: true, product });
	} catch (error) {
		return next(error);
	}
}

async function updateProduct(req, res, next) {
	try {
		const updates = {};
		productFields.forEach((field) => {
			if (req.body[field] !== undefined) updates[field] = req.body[field];
		});

		const product = await Product.findOneAndUpdate(
			{ _id: req.params.id, createdBy: req.user.userId },
			{ $set: updates },
			{ new: true, runValidators: true }
		).lean();

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found.'
			});
		}

		return res.json({
			success: true,
			message: 'Product updated successfully.',
			product
		});
	} catch (error) {
		return next(error);
	}
}

async function deleteProduct(req, res, next) {
	try {
		const product = await Product.findOneAndDelete({
			_id: req.params.id,
			createdBy: req.user.userId
		});

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found.'
			});
		}

		return res.json({
			success: true,
			message: 'Product deleted successfully.'
		});
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	createProduct,
	getProducts,
	getProductById,
	updateProduct,
	deleteProduct
};
