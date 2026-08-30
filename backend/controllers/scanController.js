const mongoose = require('mongoose');
const fs = require('fs');

const Scan = require('../models/Scan');
const Product = require('../models/Product');
const Inspection = require('../models/Inspection');

const {
    analyzeImage,
    checkAIServiceHealth
} = require('../services/aiService');


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

Content-Type: multipart/form-data

Fields:
image       -> image file
product     -> optional Product ObjectId
inspection  -> optional Inspection ObjectId
=========================================================
*/

async function createScan(req, res, next) {

    let uploadedFilePath = null;

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        /*
        -------------------------------------------------
        CHECK UPLOADED IMAGE
        -------------------------------------------------
        */

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: 'Product image file is required.'
            });

        }

        uploadedFilePath = req.file.path;


        /*
        -------------------------------------------------
        READ OPTIONAL FIELDS
        -------------------------------------------------
        */

        const {
            product,
            inspection
        } = req.body;


        /*
        -------------------------------------------------
        VALIDATE PRODUCT ID
        -------------------------------------------------
        */

        if (
            product !== undefined &&
            product !== null &&
            product !== '' &&
            !isValidObjectId(product)
        ) {

            return res.status(400).json({
                success: false,
                message: 'Invalid product ID.'
            });

        }


        /*
        -------------------------------------------------
        VALIDATE INSPECTION ID
        -------------------------------------------------
        */

        if (
            inspection !== undefined &&
            inspection !== null &&
            inspection !== '' &&
            !isValidObjectId(inspection)
        ) {

            return res.status(400).json({
                success: false,
                message: 'Invalid inspection ID.'
            });

        }


        /*
        -------------------------------------------------
        VERIFY PRODUCT OWNERSHIP
        -------------------------------------------------
        */

        if (product) {

            const productRecord =
                await Product.findOne({
                    _id: product,
                    createdBy: officer
                }).lean();


            if (!productRecord) {

                return res.status(404).json({
                    success: false,
                    message: 'Product not found.'
                });

            }

        }


        /*
        -------------------------------------------------
        VERIFY INSPECTION OWNERSHIP
        -------------------------------------------------
        */

        if (inspection) {

            const inspectionRecord =
                await Inspection.findOne({
                    _id: inspection,
                    officer,
                    ...(product ? { product } : {})
                }).lean();


            if (!inspectionRecord) {

                return res.status(404).json({
                    success: false,
                    message: 'Inspection not found.'
                });

            }

        }


        /*
        -------------------------------------------------
        CHECK AI SERVICE
        -------------------------------------------------
        */

        let aiServiceStatus = 'UNAVAILABLE';

        try {

            const health =
                await checkAIServiceHealth();

            if (health?.status === 'success') {

                aiServiceStatus = 'AVAILABLE';

            }

        } catch (error) {

            console.error(
                'AI service health check failed:',
                error.message
            );

        }


        /*
        -------------------------------------------------
        CREATE INITIAL SCAN RECORD
        -------------------------------------------------
        */

        const scan = await Scan.create({

            officer,

            product:
                product || null,

            inspection:
                inspection || null,

            imageReference:
                req.file.filename,

            status:
                'PROCESSING',

            aiServiceStatus

        });


        /*
        -------------------------------------------------
        RUN AI ANALYSIS
        -------------------------------------------------
        */

        try {

            const analysis =
                await analyzeImage(
                    uploadedFilePath,
                    req.file.originalname
                );


            /*
            ---------------------------------------------
            SAVE AI RESULTS
            ---------------------------------------------
            */

            scan.status =
                'COMPLETED';


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


            await scan.save();


            /*
            ---------------------------------------------
            SUCCESS RESPONSE
            ---------------------------------------------
            */

            return res.status(201).json({

                success: true,

                message:
                    'Product image scanned and analyzed successfully.',

                scan

            });


        } catch (error) {

            /*
            ---------------------------------------------
            AI FAILURE
            ---------------------------------------------
            */

            scan.status =
                'FAILED';


            scan.errorMessage =
                error.message ||
                'AI analysis failed.';


            await scan.save();


            return res.status(502).json({

                success: false,

                message:
                    'AI image analysis failed.',

                scanId:
                    scan._id,

                error:
                    error.message

            });

        }


    } catch (error) {

        return next(error);

    } finally {

        /*
        -------------------------------------------------
        DELETE TEMPORARY UPLOAD
        -------------------------------------------------
        */

        if (
            uploadedFilePath &&
            fs.existsSync(uploadedFilePath)
        ) {

            try {

                fs.unlinkSync(
                    uploadedFilePath
                );

            } catch (cleanupError) {

                console.error(
                    'Unable to remove temporary image:',
                    cleanupError.message
                );

            }

        }

    }

}


/*
=========================================================
GET ALL SCANS
GET /api/scans
=========================================================
*/

async function getScans(req, res, next) {

    try {

        const officer =
            getUserId(req, res);

        if (!officer) return;


        const scans =
            await Scan.find({
                officer
            })
            .sort({
                createdAt: -1
            })
            .lean();


        return res.json({

            success: true,

            count:
                scans.length,

            scans

        });

    } catch (error) {

        return next(error);

    }

}


/*
=========================================================
GET SINGLE SCAN
GET /api/scans/:id
=========================================================
*/

async function getScanById(req, res, next) {

    try {

        const officer =
            getUserId(req, res);

        if (!officer) return;


        if (
            !isValidObjectId(
                req.params.id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid scan ID.'

            });

        }


        const scan =
            await Scan.findOne({

                _id:
                    req.params.id,

                officer

            }).lean();


        if (!scan) {

            return res.status(404).json({

                success: false,

                message:
                    'Scan not found.'

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
DELETE /api/scans/:id
=========================================================
*/

async function deleteScan(req, res, next) {

    try {

        const officer =
            getUserId(req, res);

        if (!officer) return;


        if (
            !isValidObjectId(
                req.params.id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Invalid scan ID.'

            });

        }


        const scan =
            await Scan.findOneAndDelete({

                _id:
                    req.params.id,

                officer

            });


        if (!scan) {

            return res.status(404).json({

                success: false,

                message:
                    'Scan not found.'

            });

        }


        return res.json({

            success: true,

            message:
                'Scan deleted successfully.'

        });

    } catch (error) {

        return next(error);

    }

}


/*
=========================================================
AI SERVICE HEALTH
GET /api/scans/ai-health
=========================================================
*/

async function getAIHealth(req, res, next) {

    try {

        const officer =
            getUserId(req, res);

        if (!officer) return;


        const health =
            await checkAIServiceHealth();


        return res.json({

            success: true,

            aiService:
                health

        });

    } catch (error) {

        return res.status(503).json({

            success: false,

            message:
                'AI service is unavailable.',

            error:
                error.message

        });

    }

}


/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {

    createScan,

    getScans,

    getScanById,

    deleteScan,

    getAIHealth

};