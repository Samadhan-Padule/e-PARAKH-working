const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema(
    {
        // =====================================================
        // UNIQUE HUMAN-READABLE INSPECTION ID
        // Example: EP-2026-483721
        // =====================================================
        inspectionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            uppercase: true
        },


        // =====================================================
        // INSPECTOR WHO PERFORMED THE INSPECTION
        // =====================================================
        officer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // =====================================================
        // ASSIGNED SENIOR OFFICER
        //
        // This creates the hierarchy:
        // Inspector → Senior Officer
        //
        // Senior dashboard will use this field to fetch
        // completed reports belonging to that senior's team.
        // =====================================================
        seniorOfficer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // =====================================================
        // PRODUCT BEING INSPECTED
        // =====================================================
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true
        },


        // =====================================================
        // INSPECTION STATUS
        //
        // Inspector workflow:
        // PENDING → IN_PROGRESS → COMPLETED
        //
        // Senior Officer should only receive COMPLETED reports.
        // =====================================================
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


        // =====================================================
        // COMPLIANCE RESULT
        //
        // IMPORTANT:
        // Values originate from compliance.js.
        // This model only stores them.
        // =====================================================
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


        // =====================================================
        // COMPLIANCE SCORE
        // =====================================================
        complianceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },


        // =====================================================
        // PRODUCT EVIDENCE IMAGES
        //
        // Stored as image DataURLs/strings for current MVP.
        // =====================================================
        evidenceImages: {
            type: [String],
            default: []
        },


        // =====================================================
        // INSPECTOR OBSERVATIONS
        // =====================================================
        observations: {
            type: String,
            default: ""
        },


        // =====================================================
        // DETECTED VIOLATIONS
        // =====================================================
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


        // =====================================================
        // FINAL INSPECTOR REMARKS
        // =====================================================
        remarks: {
            type: String,
            default: ""
        },


        // =====================================================
        // INSPECTION COMPLETION DATE
        // =====================================================
        inspectedAt: {
            type: Date,
            default: null
        }
    },


    {
        timestamps: true
    }
);


module.exports =
    mongoose.model(
        "Inspection",
        inspectionSchema
    );