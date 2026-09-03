
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
images      -> multiple image files
product     -> optional Product ObjectId
inspection  -> optional Inspection ObjectId
panelTypes  -> optional panel type information

Maximum images: 7
=========================================================
*/

async function createScan(req, res, next) {

    let uploadedFiles = [];

    try {

        const officer = getUserId(req, res);

        if (!officer) return;


        /*
        -------------------------------------------------
        CHECK UPLOADED IMAGES
        -------------------------------------------------
        */

        const files = req.files || [];

        if (!files.length) {

            return res.status(400).json({
                success: false,
                message: 'At least one product image is required.'
            });

        }

        uploadedFiles = files;


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
        PANEL TYPES
        -------------------------------------------------
        */

        let panelTypes = [];

        if (req.body.panelTypes) {

            try {

                panelTypes =
                    typeof req.body.panelTypes === 'string'
                        ? JSON.parse(req.body.panelTypes)
                        : req.body.panelTypes;

            } catch (error) {

                console.warn(
                    'Unable to parse panelTypes:',
                    error.message
                );

                panelTypes = [];

            }

        }


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
        BUILD IMAGE METADATA
        -------------------------------------------------
        */

        const imageMetadata =
            uploadedFiles.map((file, index) => {

                const requestedPanel =
                    panelTypes[index];

                const allowedPanels = [
                    'FRONT',
                    'BACK',
                    'SIDE',
                    'TOP',
                    'BOTTOM',
                    'MRP_PANEL',
                    'OTHER'
                ];

                const panelType =
                    allowedPanels.includes(requestedPanel)
                        ? requestedPanel
                        : index === 0
                            ? 'FRONT'
                            : 'OTHER';


                return {

                    reference:
                        file.filename,

                    panelType,

                    originalName:
                        file.originalname,

                    mimeType:
                        file.mimetype,

                    width:
                        null,

                    height:
                        null,

                    capturedAt:
                        new Date()

                };

            });


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
                uploadedFiles[0].filename,

            images:
                imageMetadata,

            status:
                'PROCESSING',

            aiServiceStatus

        });


        /*
        -------------------------------------------------
        RUN AI ANALYSIS ON EVERY IMAGE
        -------------------------------------------------
        */

        try {

            const analyses = [];


            for (let index = 0; index < uploadedFiles.length; index++) {

                const file =
                    uploadedFiles[index];

                const panel =
                    imageMetadata[index]?.panelType ||
                    'OTHER';


                console.log(
    'Analyzing image ' +
    (index + 1) +
    '/' +
    uploadedFiles.length +
    ': ' +
    file.originalname +
    ' [' +
    panel +
    ']'
);


                const analysis =
                    await analyzeImage(
                        file.path,
                        file.originalname
                    );


                analyses.push({

                    panel,

                    fileName:
                        file.originalname,

                    result:
                        analysis

                });

            }


            /*
            -------------------------------------------------
            CHECK ANALYSIS RESULTS
            -------------------------------------------------
            */

            if (!analyses.length) {

                throw new Error(
                    'No AI analysis result was returned.'
                );

            }


            /*
            -------------------------------------------------
            COMBINE OCR FROM ALL PANELS
            -------------------------------------------------
            */

            scan.rawOcrText =
                analyses
                    .map(item => {

                        const analysis =
                            item.result || {};

                        return (
                            analysis.raw_ocr_text ||
                            analysis.rawOcrText ||
                            ''
                        );

                    })
                    .filter(Boolean)
                    .join('\n\n');


            /*
            -------------------------------------------------
            COMBINE EXTRACTED DATA
            -------------------------------------------------
            */

            scan.extractedData =
                analyses.reduce(
                    (combined, item) => {

                        const analysis =
                            item.result || {};

                        const data =
                            analysis.extracted_data ||
                            analysis.extractedData ||
                            analysis.product ||
                            {};

                        return {
                            ...combined,
                            ...data
                        };

                    },
                    {}
                );


            /*
            -------------------------------------------------
            PRIMARY / FRONT ANALYSIS
            -------------------------------------------------
            */

            const primaryItem =
                analyses.find(
                    item =>
                        item.panel === 'FRONT'
                ) ||
                analyses[0];


            const primaryAnalysis =
                primaryItem?.result || {};


            /*
            -------------------------------------------------
            VISION ANALYSIS
            -------------------------------------------------
            */

            scan.visionAnalysis =
                primaryAnalysis.vision_analysis ||
                primaryAnalysis.visionAnalysis ||
                null;


            /*
            -------------------------------------------------
            EVIDENCE
            -------------------------------------------------
            */

            scan.evidence =
                analyses
                    .map(item => {

                        const analysis =
                            item.result || {};

                        return analysis.evidence;

                    })
                    .filter(Boolean)
                    .flat();


            /*
            -------------------------------------------------
            COMPLIANCE RESULT
            -------------------------------------------------
            */

            scan.complianceResult =
                primaryAnalysis.compliance_result ||
                primaryAnalysis.complianceResult ||
                null;


            /*
            -------------------------------------------------
            REPORT
            -------------------------------------------------
            */

            scan.report =
                primaryAnalysis.report ||
                null;


            /*
            -------------------------------------------------
            MULTI-PANEL PROCESSING METADATA
            -------------------------------------------------
            */

            scan.processingMetadata = {

                totalImages:
                    uploadedFiles.length,

                analyzedImages:
                    analyses.length,

                panels:
                    analyses.map(item => ({
                        panel: item.panel,
                        fileName: item.fileName
                    })),

                analyzedAt:
                    new Date()

            };


            /*
            -------------------------------------------------
            MARK COMPLETED
            -------------------------------------------------
            */

            scan.status =
                'COMPLETED';


            await scan.save();


            /*
            -------------------------------------------------
            SUCCESS RESPONSE
            -------------------------------------------------
            */

            return res.status(201).json({

                success: true,

                message:
                    'Product images scanned and analyzed successfully.',

                scan

            });


        } catch (error) {

            /*
            -------------------------------------------------
            AI FAILURE
            -------------------------------------------------
            */

            console.error(
                'AI analysis failed:',
                error
            );


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
        DELETE ALL TEMPORARY UPLOADED FILES
        -------------------------------------------------
        */

        for (const file of uploadedFiles) {

            if (
                file?.path &&
                fs.existsSync(file.path)
            ) {

                try {

                    fs.unlinkSync(
                        file.path
                    );

                } catch (cleanupError) {

                 console.error(
    'Unable to remove temporary image ' +
    file.originalname +
    ':',
    cleanupError.message
);   

                }

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

