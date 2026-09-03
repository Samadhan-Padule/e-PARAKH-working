const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
    {
        // ============================================================
        // CORE RELATIONSHIPS
        // ============================================================

        scan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scan",
            required: true,
            index: true
        },

        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inspection",
            default: null,
            index: true
        },

        // ============================================================
        // EVIDENCE CONTENT
        // ============================================================

        evidenceType: {
            type: String,
            enum: [
                "OCR_TEXT",
                "DECLARATION",
                "VIOLATION",
                "COMPLIANCE_PASS",
                "COMPLIANCE_WARNING",
                "IMAGE_QUALITY",
                "BARCODE",
                "MEASUREMENT",
                "OTHER"
            ],
            default: "OTHER"
        },

        fieldName: {
            type: String,
            default: null,
            trim: true
        },

        value: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        confidence: {
            type: Number,
            default: null,
            min: 0,
            max: 1
        },

        reason: {
            type: String,
            default: null
        },

        // ============================================================
        // VISUAL HIGHLIGHTING (Phase 7)
        // Used for evidence visualization in reports
        // ============================================================

        highlightRegion: {
            type: mongoose.Schema.Types.Mixed,
            default: null
            /*
            Structure (for Phase 7):
            {
                x: Number (px),
                y: Number (px),
                width: Number (px),
                height: Number (px),
                confidence: Number (0-1)
            }
            */
        },

        highlightImageReference: {
            type: String,
            default: null,
            trim: true
            /*
            Reference to the processed image with highlights
            used for report generation (Phase 7)
            */
        },

        sourceImageReference: {
            type: String,
            default: null,
            trim: true
            /*
            Reference to the original source image
            where this evidence was detected
            */
        },

        // ============================================================
        // METADATA
        // ============================================================

        ruleId: {
            type: String,
            default: null,
            trim: true
        },

        ruleName: {
            type: String,
            default: null,
            trim: true
        },

        requiresHumanVerification: {
            type: Boolean,
            default: false
        },

        humanVerificationNotes: {
            type: String,
            default: null
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        verifiedAt: {
            type: Date,
            default: null
        },

        additionalMetadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Index for efficient querying
evidenceSchema.index({ scan: 1, evidenceType: 1 });
evidenceSchema.index({ inspection: 1 });
evidenceSchema.index({ ruleId: 1 });

module.exports = mongoose.model("Evidence", evidenceSchema);
