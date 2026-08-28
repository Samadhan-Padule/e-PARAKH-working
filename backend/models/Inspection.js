const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema(
    {
        // Officer who performed the inspection
        officer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Product being inspected
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true
        },

        // Inspection status
        status: {
            type: String,
            enum: [
                "PENDING",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        // Overall compliance result
        complianceStatus: {
            type: String,
            enum: [
                "PENDING",
                "COMPLIANT",
                "NON_COMPLIANT",
                "WARNING"
            ],
            default: "PENDING"
        },

        // Compliance score
        complianceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },

        // Product image/evidence
        evidenceImages: {
            type: [String],
            default: []
        },

        // Inspector's observations
        observations: {
            type: String,
            default: ""
        },

        // Detected violations
        violations: {
            type: [
                {
                    ruleCode: {
                        type: String,
                        trim: true
                    },
                    title: {
                        type: String,
                        trim: true
                    },
                    description: {
                        type: String,
                        trim: true
                    },
                    severity: {
                        type: String,
                        enum: [
                            "LOW",
                            "MEDIUM",
                            "HIGH",
                            "CRITICAL"
                        ],
                        default: "MEDIUM"
                    }
                }
            ],
            default: []
        },

        // Final remarks
        remarks: {
            type: String,
            default: ""
        },

        // Inspection completion date
        inspectedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Inspection", inspectionSchema);