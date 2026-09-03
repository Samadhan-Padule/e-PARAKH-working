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
        },

        // ============================================================
        // PHASE 1 — FOUNDATION EXTENSIONS (backward-compatible)
        // These fields enable future phases:
        // - Multi-image/multi-panel scanning (Phase 5)
        // - Barcode/QR detection (Phase 3)
        // - Image stitching (Phase 4)
        // - Calibration data (Phase 6)
        // ============================================================

        panelType: {
            type: String,
            enum: [
                "FRONT",
                "BACK",
                "SIDE",
                "TOP",
                "BOTTOM",
                "MRP_PANEL",
                "OTHER"
            ],
            default: "FRONT"
        },

        images: {
            type: [
                {
                    reference: { type: String, trim: true },
                    panelType: { type: String, default: "OTHER" },
                    originalName: { type: String, default: null },
                    mimeType: { type: String, default: null },
                    width: { type: Number, default: null },
                    height: { type: Number, default: null },
                    capturedAt: { type: Date, default: null },
                    _id: false
                }
            ],
            default: []
        },

        barcodeData: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        calibration: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        processingMetadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Scan", scanSchema);