const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
    {
        officer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
            index: true
        },

        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inspection",
            default: null,
            index: true
        },

        imageReference: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "UPLOADED",
                "PROCESSING",
                "COMPLETED",
                "FAILED"
            ],
            default: "UPLOADED"
        },

        rawOcrText: {
            type: String,
            default: ""
        },

        extractedData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        visionAnalysis: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        evidence: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        complianceResult: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        report: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        aiServiceStatus: {
            type: String,
            enum: [
                "NOT_CHECKED",
                "AVAILABLE",
                "UNAVAILABLE"
            ],
            default: "NOT_CHECKED"
        },

        errorMessage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Scan", scanSchema);