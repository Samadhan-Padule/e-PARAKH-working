const mongoose = require('mongoose');

const Scan = require('../models/Scan');
const Product = require('../models/Product');
const Inspection = require('../models/Inspection');
const Compliance = require('../models/Compliance');

const {
    analyzeImage,
    checkAIServiceHealth
} = require('../services/aiService');

const { validateProduct } = require('../services/complianceRuleEngine');


function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}


function getUserId(req, res) {
    const userId = req.user?.userId;

    if (!userId || !isValidObjectId(userId)) {
        res.status(401).json({
            success: false,
            message: 'Invalid authenticated user.'
        });

        return null;
    }

    return userId;
}


/*
=========================================================
CREATE / RUN SCAN
POST /api/scans
=========================================================
*/

async function createScan(req, res, next) {

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        const {
            image,
            product,
            inspection
        } = req.body;


        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image reference is required.'
            });
        }


        if (
            product &&
            !isValidObjectId(product)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID.'
            });
        }


        if (
            inspection &&
            !isValidObjectId(inspection)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid inspection ID.'
            });
        }


        /*
        --------------------------------------------------
        VERIFY PRODUCT
        --------------------------------------------------
        */

        let productRecord = null;

        if (product) {

            productRecord = await Product.findOne({
                _id: product,
                createdBy: officer
            });

            if (!productRecord) {

                return res.status(404).json({
                    success: false,
                    message: 'Product not found.'
                });

            }

        }


        /*
        --------------------------------------------------
        VERIFY INSPECTION
        --------------------------------------------------
        */

        let inspectionRecord = null;

        if (inspection) {

            inspectionRecord = await Inspection.findOne({
                _id: inspection,
                officer,
                ...(product ? { product } : {})
            });

            if (!inspectionRecord) {

                return res.status(404).json({
                    success: false,
                    message: 'Inspection not found.'
                });

            }

        }


        /*
        --------------------------------------------------
        CHECK AI SERVICE
        --------------------------------------------------
        */

        let aiServiceStatus = 'UNAVAILABLE';

        try {

            const health = await checkAIServiceHealth();

            if (health) {
                aiServiceStatus = 'AVAILABLE';
            }

        } catch (error) {

            console.error(
                'AI service health check failed:',
                error.message
            );

        }


        /*
        --------------------------------------------------
        CREATE SCAN
        --------------------------------------------------
        */

        const scan = await Scan.create({

            officer,

            product: product || null,

            inspection: inspection || null,

            imageReference: image,

            status: 'PROCESSING',

            aiServiceStatus

        });


        /*
        ==================================================
        RUN AI ANALYSIS
        ==================================================
        */

        try {

            const analysis = await analyzeImage(image);


            /*
            ------------------------------------------------
            SAVE AI RESULT INTO SCAN
            ------------------------------------------------
            */

            scan.status = 'COMPLETED';

            scan.rawOcrText =
                analysis.raw_ocr_text ||
                analysis.rawOcrText ||
                '';

            scan.extractedData =
                analysis.extracted_data ||
                analysis.extractedData ||
                analysis.product ||
                {};

            scan.visionAnalysis =
                analysis.vision_analysis ||
                analysis.visionAnalysis ||
                null;

            scan.evidence =
                analysis.evidence ||
                null;

            scan.complianceResult =
                analysis.compliance_result ||
                analysis.complianceResult ||
                null;

            scan.report =
                analysis.report ||
                null;


            /*
            =================================================
            AUTO UPDATE PRODUCT FROM AI
            =================================================
            */

            const extracted = scan.extractedData || {};

            if (productRecord) {

                if (extracted.product_name)
                    productRecord.productName =
                        extracted.product_name;

                if (extracted.manufacturer)
                    productRecord.manufacturer =
                        extracted.manufacturer;

                if (extracted.brand_name)
                    productRecord.brandName =
                        extracted.brand_name;

                if (extracted.net_quantity)
                    productRecord.netQuantity =
                        extracted.net_quantity;

                if (extracted.mrp)
                    productRecord.mrp =
                        extracted.mrp;

                if (extracted.date_of_manufacture)
                    productRecord.packingDate =
                        extracted.date_of_manufacture;

                if (extracted.customer_care)
                    productRecord.consumerCare =
                        extracted.customer_care;

                if (extracted.manufacturer_address)
                    productRecord.address =
                        extracted.manufacturer_address;

                productRecord.source = 'AI';

                await productRecord.save();

            }


            /*
            =================================================
            AUTO COMPLIANCE ANALYSIS
            =================================================
            */

            let complianceRecord = null;

            if (productRecord && inspectionRecord) {

                const assessment =
                    validateProduct(productRecord.toObject());


                complianceRecord =
                    await Compliance.findOneAndUpdate(

                        {
                            product: productRecord._id,
                            inspection: inspectionRecord._id,
                            officer
                        },

                        {

                            product: productRecord._id,

                            inspection: inspectionRecord._id,

                            officer,

                            overallStatus:
                                assessment.status === 'PASS'
                                    ? 'COMPLIANT'
                                    : assessment.status === 'WARNING'
                                        ? 'WARNING'
                                        : 'NON_COMPLIANT',

                            complianceScore:
                                assessment.score,

                            declarationResults:
                                assessment.declarationResults,

                            extractedDeclarations:
                                assessment.extractedDeclarations,

                            validationResults:
                                assessment.validationResults,

                            violations:
                                assessment.violations,

                            warnings:
                                assessment.warnings

                        },

                        {
                            new: true,
                            upsert: true,
                            runValidators: true
                        }

                    );


                /*
                ---------------------------------------------
                UPDATE INSPECTION
                ---------------------------------------------
                */

                inspectionRecord.status = 'COMPLETED';

                inspectionRecord.complianceStatus =
                    complianceRecord.overallStatus;

                inspectionRecord.complianceScore =
                    complianceRecord.complianceScore;

                inspectionRecord.violations =
                    (assessment.violations || []).map(v => ({

                        ruleCode: v.rule || '',

                        title: v.field || v.category || '',

                        description: v.message || '',

                        severity:
                            ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                                .includes(v.severity)
                                ? v.severity
                                : 'MEDIUM'

                    }));

                inspectionRecord.inspectedAt = new Date();

                await inspectionRecord.save();

            }


            /*
            ------------------------------------------------
            SAVE SCAN
            ------------------------------------------------
            */

            await scan.save();


            /*
            =================================================
            FINAL RESPONSE
            =================================================
            */

            return res.status(201).json({

                success: true,

                message:
                    'Product image scanned and analyzed successfully.',

                scan,

                product:
                    productRecord || null,

                inspection:
                    inspectionRecord || null,

                compliance:
                    complianceRecord || null

            });


        } catch (error) {

            scan.status = 'FAILED';

            scan.errorMessage =
                error.message ||
                'AI analysis failed.';

            await scan.save();


            return res.status(502).json({

                success: false,

                message:
                    'AI image analysis failed.',

                scanId: scan._id,

                error: error.message

            });

        }


    } catch (error) {

        return next(error);

    }

}


/*
=========================================================
GET ALL SCANS
=========================================================
*/

async function getScans(req, res, next) {

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        const scans =
            await Scan.find({ officer })
                .sort({ createdAt: -1 })
                .lean();


        return res.json({

            success: true,

            count: scans.length,

            scans

        });

    } catch (error) {

        return next(error);

    }

}


/*
=========================================================
GET SINGLE SCAN
=========================================================
*/

async function getScanById(req, res, next) {

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        if (!isValidObjectId(req.params.id)) {

            return res.status(400).json({

                success: false,

                message: 'Invalid scan ID.'

            });

        }


        const scan =
            await Scan.findOne({

                _id: req.params.id,

                officer

            }).lean();


        if (!scan) {

            return res.status(404).json({

                success: false,

                message: 'Scan not found.'

            });

        }


        return res.json({

            success: true,

            scan

        });

    } catch (error) {

        return next(error);

    }

}


/*
=========================================================
DELETE SCAN
=========================================================
*/

async function deleteScan(req, res, next) {

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        if (!isValidObjectId(req.params.id)) {

            return res.status(400).json({

                success: false,

                message: 'Invalid scan ID.'

            });

        }


        const scan =
            await Scan.findOneAndDelete({

                _id: req.params.id,

                officer

            });


        if (!scan) {

            return res.status(404).json({

                success: false,

                message: 'Scan not found.'

            });

        }


        return res.json({

            success: true,

            message: 'Scan deleted successfully.'

        });

    } catch (error) {

        return next(error);

    }

}


/*
=========================================================
AI SERVICE HEALTH
=========================================================
*/

async function getAIHealth(req, res, next) {

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        const health =
            await checkAIServiceHealth();


        return res.json({

            success: true,

            aiService: health

        });

    } catch (error) {

        return res.status(503).json({

            success: false,

            message: 'AI service is unavailable.',

            error: error.message

        });

    }

}


module.exports = {

    createScan,

    getScans,

    getScanById,

    deleteScan,

    getAIHealth

};