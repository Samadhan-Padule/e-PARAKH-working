const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true
        },

        manufacturer: {
            type: String,
            required: true,
            trim: true
        },

        brandName: {
            type: String,
            trim: true,
            default: ""
        },

        netQuantity: {
            type: String,
            trim: true,
            default: ""
        },

        mrp: {
            type: String,
            trim: true,
            default: ""
        },

        packingDate: {
            type: String,
            trim: true,
            default: ""
        },

        consumerCare: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        additionalDeclarations: {
            type: String,
            trim: true,
            default: ""
        },

        productImage: {
            type: String,
            default: ""
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        source: {
            type: String,
            enum: ["MANUAL", "SCAN", "AI"],
            default: "MANUAL"
        },

        aiConfidence: {
            type: Number,
            min: 0,
            max: 1,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);