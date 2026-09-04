/* =========================================================
   e-PARAKH — COMPLIANCE MODULE
   MASTER CORRECTED VERSION

   ARCHITECTURE
   ---------------------------------------------------------
   scan / camera.js
          ↓
   inspection.js
          ↓
   currentInspection + aiAnalysisResult
          ↓
   compliance.js
          ↓
   complianceResult
          ↓
   result.js
          ↓
   MongoDB / Inspector History / Senior Dashboard

   IMPORTANT RULES
   ---------------------------------------------------------
   - compliance.js is the SINGLE SOURCE OF TRUTH for compliance.
   - compliance.js does NOT generate Inspection ID.
   - Inspection ID is generated ONLY by inspection.js.
   - Product data comes from currentInspection / AI result.
   - Evidence comes from the CURRENT scanner IndexedDB.
   - ALL scanned images are loaded as evidence.
   - Final complianceResult is saved ONLY on Generate Result.
   - No artificial score is inserted.
========================================================= */


document.addEventListener("DOMContentLoaded", async () => {

    console.log("======================================");
    console.log("e-PARAKH COMPLIANCE MODULE STARTED");
    console.log("======================================");


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const inspectionIdElement =
        document.getElementById("inspectionId");

    const officerNameElement =
        document.getElementById("officerName");

    const officerIdElement =
        document.getElementById("officerId");

    const officerAvatar =
        document.getElementById("officerAvatar");

    const summaryManufacturer =
        document.getElementById("summaryManufacturer");

    const summaryProductName =
        document.getElementById("summaryProductName");

    const summaryQuantity =
        document.getElementById("summaryQuantity");

    const summaryMrp =
        document.getElementById("summaryMrp");

    const summaryPackingDate =
        document.getElementById("summaryPackingDate");

    const summaryConsumerCare =
        document.getElementById("summaryConsumerCare");

    const summaryStatus =
        document.getElementById("summaryStatus");

    const complianceScore =
        document.getElementById("complianceScore");

    const scoreBadge =
        document.getElementById("scoreBadge");

    const scoreCircle =
        document.getElementById("scoreCircle");

    const scoreMessage =
        document.getElementById("scoreMessage");

    const verificationCount =
        document.getElementById("verificationCount");

    const observation =
        document.getElementById("observation");

    const decisionText =
        document.getElementById("decisionText");

    const generateBtn =
        document.getElementById("generateBtn");

    const backBtn =
        document.getElementById("backBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    /* =====================================================
       STORAGE HELPERS
    ===================================================== */

    function getStorageJSON(
        storage,
        key,
        fallback = null
    ) {

        try {

            const raw =
                storage.getItem(key);

            if (!raw) {
                return fallback;
            }

            return JSON.parse(raw);

        } catch (error) {

            console.warn(
                `Unable to parse ${key}:`,
                error
            );

            return fallback;
        }
    }


    function safeSetStorageJSON(
        storage,
        key,
        value
    ) {

        try {

            storage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                `Unable to save ${key}:`,
                error
            );

            return false;
        }
    }


    /* =====================================================
       OFFICER
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem(
            "officerName"
        ) ||
        "Authorized Officer";


    const savedOfficerId =
        localStorage.getItem(
            "officerId"
        ) ||
        "Officer ID";


    if (officerNameElement) {

        officerNameElement.textContent =
            savedOfficerName;
    }


    if (officerIdElement) {

        officerIdElement.textContent =
            savedOfficerId;
    }


    if (officerAvatar) {

        const words =
            String(savedOfficerName)
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        let initials = "AO";


        if (words.length === 1) {

            initials =
                words[0]
                    .substring(0, 2)
                    .toUpperCase();

        } else if (words.length > 1) {

            initials =
                (
                    words[0][0] +
                    words[words.length - 1][0]
                ).toUpperCase();
        }


        officerAvatar.textContent =
            initials;
    }


    /* =====================================================
       LOAD CURRENT INSPECTION
    ===================================================== */

    let inspectionData = {};


    try {

        const savedInspection =
            localStorage.getItem(
                "currentInspection"
            );


        if (savedInspection) {

            inspectionData =
                JSON.parse(
                    savedInspection
                );


            if (
                !inspectionData ||
                typeof inspectionData !== "object" ||
                Array.isArray(inspectionData)
            ) {

                inspectionData = {};
            }


            console.log(
                "CURRENT INSPECTION:",
                inspectionData
            );

        } else {

            console.warn(
                "currentInspection not found."
            );
        }

    } catch (error) {

        console.error(
            "Unable to parse currentInspection:",
            error
        );

        inspectionData = {};
    }


    /* =====================================================
       LOAD AI ANALYSIS
    ===================================================== */

    let aiAnalysis = {};


    try {

        const sessionAI =
            sessionStorage.getItem(
                "aiAnalysisResult"
            );


        const localAI =
            localStorage.getItem(
                "aiAnalysisResult"
            );


        let savedAI =
            sessionAI ||
            localAI ||
            null;


        /*
         * currentInspection may already contain
         * the AI result copied by inspection.js.
         */

        if (
            !savedAI &&
            inspectionData &&
            inspectionData.aiAnalysis
        ) {

            savedAI =
                inspectionData.aiAnalysis;
        }


        if (savedAI) {

            aiAnalysis =
                typeof savedAI === "string"
                    ? JSON.parse(savedAI)
                    : savedAI;


            if (
                !aiAnalysis ||
                typeof aiAnalysis !== "object" ||
                Array.isArray(aiAnalysis)
            ) {

                aiAnalysis = {};
            }


            console.log(
                "AI ANALYSIS LOADED:",
                aiAnalysis
            );

        } else {

            console.warn(
                "NO AI ANALYSIS FOUND."
            );
        }

    } catch (error) {

        console.error(
            "Unable to load AI analysis:",
            error
        );

        aiAnalysis = {};
    }


    /* =====================================================
       NORMALIZE AI DATA
    ===================================================== */

    let aiData = {};


    if (
        aiAnalysis &&
        typeof aiAnalysis === "object"
    ) {

        aiData =
            aiAnalysis.extracted_data ||
            aiAnalysis.extractedData ||
            aiAnalysis.product ||
            aiAnalysis.data ||
            {};
    }


    if (
        (
            !aiData ||
            typeof aiData !== "object" ||
            Array.isArray(aiData) ||
            Object.keys(aiData).length === 0
        ) &&
        aiAnalysis &&
        aiAnalysis.result
    ) {

        const nestedResult =
            aiAnalysis.result;


        if (
            nestedResult &&
            typeof nestedResult === "object"
        ) {

            aiData =
                nestedResult.extracted_data ||
                nestedResult.extractedData ||
                nestedResult.product ||
                nestedResult.data ||
                nestedResult;
        }
    }


    if (
        !aiData ||
        typeof aiData !== "object" ||
        Array.isArray(aiData)
    ) {

        aiData = {};
    }


    console.log(
        "NORMALIZED AI DATA:",
        aiData
    );


    /* =====================================================
       RAW OCR
    ===================================================== */

    const rawOCR =
        aiAnalysis?.raw_ocr_text ||
        aiAnalysis?.rawOcrText ||
        aiAnalysis?.rawOCRText ||
        aiAnalysis?.ocr_text ||
        aiAnalysis?.ocrText ||
        "";


    console.log(
        "RAW OCR TEXT:",
        rawOCR
    );


    /* =====================================================
       HELPERS
    ===================================================== */

    function valueExists(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return false;
        }


        if (
            typeof value === "object"
        ) {

            if (Array.isArray(value)) {

                return value.length > 0;
            }


            return (
                Object.keys(value).length > 0
            );
        }


        return (
            String(value)
                .trim()
                .length > 0
        );
    }


    function cleanValue(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return "";
        }


        if (
            typeof value === "object"
        ) {

            try {

                if (Array.isArray(value)) {

                    return value
                        .map(item => cleanValue(item))
                        .filter(Boolean)
                        .join(", ");
                }


                return JSON.stringify(value);

            } catch (_) {

                return "";
            }
        }


        return String(value).trim();
    }


    function firstValue(...values) {

        for (
            const value of values
        ) {

            if (
                valueExists(value)
            ) {

                return cleanValue(
                    value
                );
            }
        }


        return "";
    }


    function setText(
        element,
        value,
        fallback = "Not provided"
    ) {

        if (!element) {
            return;
        }


        if (
            valueExists(value)
        ) {

            element.textContent =
                cleanValue(value);

        } else {

            element.textContent =
                fallback;
        }
    }


    /* =====================================================
       ADDITIONAL DECLARATIONS
    ===================================================== */

    function buildAdditionalDeclarations(
        data
    ) {

        const additional = [];


        const fields = [

            [
                "brand_name",
                "Brand"
            ],

            [
                "brand_owner",
                "Brand Owner"
            ],

            [
                "country_of_origin",
                "Country of Origin"
            ],

            [
                "fssai_license",
                "FSSAI License"
            ],

            [
                "epr_registration",
                "EPR Registration"
            ],

            [
                "batch_number",
                "Batch No."
            ],

            [
                "use_by",
                "Use By"
            ],

            [
                "ingredients",
                "Ingredients"
            ]

        ];


        fields.forEach(
            ([key, label]) => {

                if (
                    valueExists(
                        data?.[key]
                    )
                ) {

                    additional.push(
                        `${label}: ${cleanValue(
                            data[key]
                        )}`
                    );
                }
            }
        );


        return additional.join(
            "\n"
        );
    }


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    const productData = {

        manufacturer:
            firstValue(

                inspectionData.manufacturer,

                inspectionData.manufacturerName,

                inspectionData.product?.manufacturer,

                aiData.manufacturer,

                aiData.manufacturer_name,

                aiData.manufacturerName,

                aiData.packer,

                aiData.packer_name,

                aiData.importer,

                aiData.importer_name
            ),


        productName:
            firstValue(

                inspectionData.productName,

                inspectionData.product_name,

                inspectionData.product?.productName,

                inspectionData.product?.product_name,

                aiData.product_name,

                aiData.productName,

                aiData.name,

                aiData.commodity_name,

                aiData.commodityName
            ),


        netQuantity:
            firstValue(

                inspectionData.netQuantity,

                inspectionData.net_quantity,

                inspectionData.product?.netQuantity,

                inspectionData.product?.net_quantity,

                aiData.net_quantity,

                aiData.netQuantity,

                aiData.quantity,

                aiData.net_weight
            ),


        mrp:
            firstValue(

                inspectionData.mrp,

                inspectionData.product?.mrp,

                aiData.mrp,

                aiData.maximum_retail_price,

                aiData.maximumRetailPrice,

                aiData.max_retail_price
            ),


        packingDate:
            firstValue(

                inspectionData.packingDate,

                inspectionData.packing_date,

                inspectionData.product?.packingDate,

                inspectionData.product?.packing_date,

                aiData.date_of_manufacture,

                aiData.date_of_packing,

                aiData.packing_date,

                aiData.packingDate,

                aiData.manufacturing_date,

                aiData.manufacture_date,

                aiData.date_of_manufacturing
            ),


        consumerCare:
            firstValue(

                inspectionData.consumerCare,

                inspectionData.customerCare,

                inspectionData.product?.consumerCare,

                inspectionData.product?.consumer_care,

                aiData.customer_care,

                aiData.consumer_care,

                aiData.consumerCare,

                aiData.customer_care_details,

                aiData.consumer_care_details
            ),


        address:
            firstValue(

                inspectionData.address,

                inspectionData.manufacturerAddress,

                inspectionData.product?.address,

                aiData.manufacturer_address,

                aiData.manufacturerAddress,

                aiData.address,

                aiData.registered_address,

                aiData.packer_address,

                aiData.importer_address
            ),


        additionalDeclarations:
            firstValue(

                inspectionData.additionalDeclarations,

                inspectionData.additional_declarations,

                inspectionData.product?.additionalDeclarations,

                inspectionData.product?.additional_declarations,

                buildAdditionalDeclarations(
                    aiData
                )
            )

    };


    console.log(
        "FINAL NORMALIZED PRODUCT DATA:",
        productData
    );


    /* =====================================================
       INSPECTION ID
       READ ONLY
       DO NOT GENERATE
    ===================================================== */

    let inspectionId =
        localStorage.getItem(
            "currentInspectionId"
        ) ||
        inspectionData.inspectionId ||
        inspectionData.inspection_id ||
        "";


    inspectionId =
        String(
            inspectionId || ""
        )
            .trim()
            .toUpperCase();


    /*
     * compliance.js NEVER creates an Inspection ID.
     */

    if (!inspectionId) {

        console.error(
            "Inspection ID is missing. inspection.js should have generated it."
        );

    } else {

        localStorage.setItem(
            "currentInspectionId",
            inspectionId
        );
    }


    if (inspectionIdElement) {

        inspectionIdElement.textContent =
            inspectionId ||
            "—";
    }


    console.log(
        "COMPLIANCE INSPECTION ID:",
        inspectionId
    );


    /* =====================================================
       DISPLAY PRODUCT SUMMARY
    ===================================================== */

    setText(
        summaryManufacturer,
        productData.manufacturer
    );


    setText(
        summaryProductName,
        productData.productName
    );


    setText(
        summaryQuantity,
        productData.netQuantity
    );


    setText(
        summaryMrp,
        productData.mrp
    );


    setText(
        summaryPackingDate,
        productData.packingDate
    );


    setText(
        summaryConsumerCare,
        productData.consumerCare
    );


    if (summaryStatus) {

        const dataLoaded =
            valueExists(
                productData.productName
            ) ||
            valueExists(
                productData.manufacturer
            ) ||
            Object.keys(aiData).length > 0;


        summaryStatus.textContent =
            dataLoaded
                ? "DATA LOADED"
                : "NO AI DATA";
    }


    /* =====================================================
       INDEXEDDB CONFIGURATION
       CURRENT SCANNER STORAGE

       IMPORTANT:
       scanner.js uses:

       DB:
       eParakhScannerDB

       VERSION:
       3

       STORE:
       panelImages
    ===================================================== */

    const EVIDENCE_DB_NAME =
        "eParakhScannerDB";


    const EVIDENCE_DB_VERSION =
        3;


    const EVIDENCE_STORE_NAME =
        "panelImages";


    /* =====================================================
       OPEN CURRENT SCANNER DATABASE
    ===================================================== */

    function openEvidenceDB() {

        return new Promise(
            (resolve, reject) => {

                if (
                    !window.indexedDB
                ) {

                    reject(
                        new Error(
                            "IndexedDB is not supported."
                        )
                    );

                    return;
                }


                const request =
                    indexedDB.open(
                        EVIDENCE_DB_NAME,
                        EVIDENCE_DB_VERSION
                    );


                request.onsuccess =
                    () => {

                        const db =
                            request.result;


                        if (
                            !db.objectStoreNames.contains(
                                EVIDENCE_STORE_NAME
                            )
                        ) {

                            db.close();


                            reject(
                                new Error(
                                    "Scanner evidence store not found."
                                )
                            );


                            return;
                        }


                        resolve(db);
                    };


                request.onerror =
                    () => {

                        reject(
                            request.error ||
                            new Error(
                                "Unable to open scanner evidence database."
                            )
                        );
                    };


                request.onblocked =
                    () => {

                        reject(
                            new Error(
                                "Scanner evidence database request was blocked."
                            )
                        );
                    };

            }
        );
    }


    /* =====================================================
       LOAD ALL CURRENT SCANNER EVIDENCE

       Supports:

       {
          id,
          panel,
          name,
          type,
          file,
          dataUrl,
          source,
          createdAt
       }

       This matches scanner.js.
    ===================================================== */

    async function getAllEvidence() {

        let db = null;


        try {

            db =
                await openEvidenceDB();


            const records =
                await new Promise(
                    (resolve, reject) => {

                        const transaction =
                            db.transaction(
                                EVIDENCE_STORE_NAME,
                                "readonly"
                            );


                        const store =
                            transaction.objectStore(
                                EVIDENCE_STORE_NAME
                            );


                        const request =
                            store.openCursor();


                        const results = [];


                        request.onsuccess =
                            () => {

                                const cursor =
                                    request.result;


                                if (!cursor) {

                                    resolve(
                                        results
                                    );

                                    return;
                                }


                                const value =
                                    cursor.value;


                                if (
                                    value &&
                                    typeof value === "object"
                                ) {

                                    const panel =
                                        value.panel ||
                                        value.category ||
                                        "OTHER";


                                    const dataUrl =
                                        value.dataUrl ||
                                        value.data ||
                                        value.imageData ||
                                        value.src ||
                                        value.url ||
                                        "";


                                    if (
                                        dataUrl
                                    ) {

                                        results.push({

                                            id:
                                                value.id ||
                                                String(
                                                    cursor.key
                                                ),

                                            panel:
                                                String(
                                                    panel
                                                )
                                                    .trim()
                                                    .toUpperCase(),

                                            name:
                                                value.name ||
                                                `${String(
                                                    panel
                                                )
                                                    .trim()
                                                    .toUpperCase()} evidence`,

                                            type:
                                                value.type ||
                                                "image/jpeg",

                                            source:
                                                value.source ||
                                                "camera",

                                            createdAt:
                                                value.createdAt ||
                                                null,

                                            dataUrl:
                                                String(
                                                    dataUrl
                                                ).trim()

                                        });
                                    }

                                } else if (
                                    typeof value === "string" &&
                                    value.trim()
                                ) {

                                    /*
                                     * Legacy string support.
                                     */

                                    results.push({

                                        id:
                                            String(
                                                cursor.key
                                            ),

                                        panel:
                                            String(
                                                cursor.key
                                            )
                                                .trim()
                                                .toUpperCase(),

                                        name:
                                            `${String(
                                                cursor.key
                                            )
                                                .trim()
                                                .toUpperCase()} evidence`,

                                        type:
                                            "image/jpeg",

                                        source:
                                            "camera",

                                        createdAt:
                                            null,

                                        dataUrl:
                                            value.trim()
                                    });
                                }


                                cursor.continue();
                            };


                        request.onerror =
                            () => {

                                reject(
                                    request.error ||
                                    new Error(
                                        "Unable to read scanner evidence."
                                    )
                                );
                            };


                        transaction.onerror =
                            () => {

                                reject(
                                    transaction.error ||
                                    new Error(
                                        "Scanner evidence transaction failed."
                                    )
                                );
                            };

                    }
                );


            /* =================================================
               PREDICTABLE PANEL ORDER
            ================================================= */

            const order = {

                FRONT: 1,

                BACK: 2,

                SIDE: 3,

                TOP: 4,

                BOTTOM: 5,

                MRP_PANEL: 6,

                BATCH: 7,

                MRP: 8,

                OTHER: 99

            };


            results.sort(
                (a, b) => {

                    const orderA =
                        order[
                            String(
                                a.panel ||
                                "OTHER"
                            )
                                .trim()
                                .toUpperCase()
                        ] || 99;


                    const orderB =
                        order[
                            String(
                                b.panel ||
                                "OTHER"
                            )
                                .trim()
                                .toUpperCase()
                        ] || 99;


                    if (
                        orderA !== orderB
                    ) {

                        return (
                            orderA -
                            orderB
                        );
                    }


                    /*
                     * Same panel:
                     * sort by creation time.
                     */

                    const timeA =
                        a.createdAt
                            ? new Date(
                                a.createdAt
                            ).getTime()
                            : 0;


                    const timeB =
                        b.createdAt
                            ? new Date(
                                b.createdAt
                            ).getTime()
                            : 0;


                    return (
                        timeA -
                        timeB
                    );
                }
            );


            console.log(
                "ALL SCANNED EVIDENCE:",
                results
            );


            console.log(
                "TOTAL EVIDENCE IMAGES:",
                results.length
            );


            return results;

        } catch (error) {

            console.warn(
                "Evidence loading failed:",
                error
            );


            return [];

        } finally {

            if (db) {

                try {

                    db.close();

                } catch (_) {}
            }
        }
    }


    /* =====================================================
       LOAD EVIDENCE
    ===================================================== */

    const evidenceRecords =
        await getAllEvidence();


    /* =====================================================
       EVIDENCE INFORMATION
    ===================================================== */

    const evidenceInformation = {

        evidenceAvailable:
            evidenceRecords.length > 0,

        evidenceCount:
            evidenceRecords.length,

        evidenceSource:
            "eParakhScannerDB",

        panels:
            evidenceRecords.map(
                item => ({

                    id:
                        item.id,

                    panel:
                        item.panel ||
                        "OTHER",

                    name:
                        item.name ||
                        "",

                    type:
                        item.type ||
                        "image/jpeg",

                    source:
                        item.source ||
                        "camera",

                    createdAt:
                        item.createdAt ||
                        null
                })
            ),

        evidenceLoadedAt:
            new Date().toISOString()
    };


    console.log(
        "EVIDENCE INFORMATION:",
        evidenceInformation
    );


    /* =====================================================
       CHECKBOXES
    ===================================================== */

    const ruleCheckboxes =
        document.querySelectorAll(
            ".rule-checkbox"
        );


    console.log(
        "CHECKBOX COUNT:",
        ruleCheckboxes.length
    );


    /* =====================================================
       RULE DETECTION
    ===================================================== */

    function isRuleDetected(rule) {

        switch (rule) {

            case "manufacturer":

                return valueExists(
                    productData.manufacturer
                );


            case "productName":

                return valueExists(
                    productData.productName
                );


            case "quantity":

                return valueExists(
                    productData.netQuantity
                );


            case "mrp":

                return valueExists(
                    productData.mrp
                );


            case "date":

                return valueExists(
                    productData.packingDate
                );


            case "consumerCare":

                return valueExists(
                    productData.consumerCare
                );


            case "address":

                return valueExists(
                    productData.address
                );


            case "additional":

                return valueExists(
                    productData.additionalDeclarations
                );


            default:

                return false;
        }
    }


    function getDetectedValue(rule) {

        switch (rule) {

            case "manufacturer":

                return productData.manufacturer;


            case "productName":

                return productData.productName;


            case "quantity":

                return productData.netQuantity;


            case "mrp":

                return productData.mrp;


            case "date":

                return productData.packingDate;


            case "consumerCare":

                return productData.consumerCare;


            case "address":

                return productData.address;


            case "additional":

                return productData.additionalDeclarations;


            default:

                return "";
        }
    }


    /* =====================================================
       RULE NAMES
    ===================================================== */

    function getRuleDisplayName(rule) {

        const names = {

            manufacturer:
                "Manufacturer / Packer / Importer",

            productName:
                "Product Name",

            quantity:
                "Net Quantity",

            mrp:
                "MRP Declaration",

            date:
                "Packing / Manufacturing Date",

            consumerCare:
                "Consumer Care",

            address:
                "Manufacturer Address",

            additional:
                "Additional Declarations"
        };


        return (
            names[rule] ||
            rule
        );
    }


    function getRuleDescription(rule) {

        const descriptions = {

            manufacturer:
                "Manufacturer, packer or importer details must be declared.",

            productName:
                "Name of the commodity must be declared.",

            quantity:
                "Net quantity must be declared.",

            mrp:
                "Maximum Retail Price must be declared.",

            date:
                "Packing or manufacturing date must be declared.",

            consumerCare:
                "Consumer care details must be declared.",

            address:
                "Complete manufacturer or packer address must be declared.",

            additional:
                "Additional product declarations."
        };


        return (
            descriptions[rule] ||
            "Compliance requirement."
        );
    }


    /* =====================================================
       RULE VISUAL STATE
    ===================================================== */

    function updateRuleVisualState(
        checkbox,
        detected
    ) {

        const ruleItem =
            checkbox.closest(
                ".rule-item"
            );


        if (!ruleItem) {
            return;
        }


        const status =
            ruleItem.querySelector(
                ".rule-status"
            );


        ruleItem.classList.remove(
            "verified",
            "missing",
            "pending"
        );


        if (!detected) {

            ruleItem.classList.add(
                "missing"
            );


            checkbox.checked =
                false;


            checkbox.disabled =
                true;


            if (status) {

                status.textContent =
                    "Missing";
            }


            return;
        }


        checkbox.disabled =
            false;


        if (checkbox.checked) {

            ruleItem.classList.add(
                "verified"
            );


            if (status) {

                status.textContent =
                    "Verified";
            }

        } else {

            ruleItem.classList.add(
                "pending"
            );


            if (status) {

                status.textContent =
                    "Detected";
            }
        }
    }


    /* =====================================================
       BUILD CHECKS
    ===================================================== */

    function buildChecks() {

        return Array.from(
            ruleCheckboxes
        ).map(
            checkbox => {

                const rule =
                    checkbox.dataset.rule ||
                    "";


                const ruleItem =
                    checkbox.closest(
                        ".rule-item"
                    );


                const name =
                    ruleItem
                        ?.querySelector(
                            ".rule-content strong"
                        )
                        ?.textContent
                        ?.trim() ||
                    getRuleDisplayName(
                        rule
                    );


                const description =
                    ruleItem
                        ?.querySelector(
                            ".rule-content small"
                        )
                        ?.textContent
                        ?.trim() ||
                    getRuleDescription(
                        rule
                    );


                const detected =
                    isRuleDetected(
                        rule
                    );


                let status;


                if (!detected) {

                    status =
                        "fail";

                } else if (
                    checkbox.checked
                ) {

                    status =
                        "pass";

                } else {

                    status =
                        "pending";
                }


                return {

                    rule,

                    name,

                    description,

                    detected,

                    extractedValue:
                        getDetectedValue(
                            rule
                        ),

                    officerVerified:
                        checkbox.checked,

                    status
                };
            }
        );
    }


    /* =====================================================
       COMPLIANCE RESULT BUILDER
    ===================================================== */

    function buildComplianceResult(
        calculated
    ) {

        const {

            score,

            passed,

            failed,

            pending,

            total,

            checks,

            status

        } = calculated;


        const violations =
            checks
                .filter(
                    check =>
                        check.status ===
                        "fail"
                )
                .map(
                    check => ({

                        ruleCode:
                            String(
                                check.rule ||
                                ""
                            ).trim(),

                        title:
                            check.name,

                        description:
                            check.description,

                        extractedValue:
                            check.extractedValue ||
                            "",

                        rule:
                            check.rule,

                        severity:
                            "MEDIUM"
                    })
                );


        return {

            inspectionId,

            status,

            score,

            total,

            passed,

            failed,

            pending,

            checks,

            violations,

            product:
                productData,

            aiAnalysis,

            rawOCR,

            evidence:
                evidenceInformation,

            officer: {

                name:
                    savedOfficerName,

                id:
                    savedOfficerId
            },

            observation:
                observation
                    ? observation.value.trim()
                    : "",

            generatedAt:
                new Date().toISOString()
        };
    }


    /* =====================================================
       SAVE FINAL COMPLIANCE RESULT
    ===================================================== */

    function saveComplianceResult(
        calculated
    ) {

        if (!inspectionId) {

            console.error(
                "Cannot save compliance result because Inspection ID is missing."
            );


            return null;
        }


        const result =
            buildComplianceResult(
                calculated
            );


        const saved =
            safeSetStorageJSON(
                localStorage,
                "complianceResult",
                result
            );


        if (!saved) {

            console.error(
                "Final complianceResult could not be saved."
            );


            return null;
        }


        console.log(
            "COMPLIANCE RESULT SAVED:",
            result
        );


        return result;
    }


    /* =====================================================
       UPDATE SCORE CIRCLE
       IMPORTANT:
       CSS --score MUST BE A NUMBER
       Example:
       --score: 75

       NOT:
       --score: 75%
    ===================================================== */

    function updateScoreCircle(
        score
    ) {

        if (!scoreCircle) {
            return;
        }


        scoreCircle.style.setProperty(
            "--score",
            score
        );


        scoreCircle.classList.remove(
            "score-good",
            "score-warning",
            "score-danger"
        );


        if (score >= 90) {

            scoreCircle.classList.add(
                "score-good"
            );

        } else if (score >= 70) {

            scoreCircle.classList.add(
                "score-warning"
            );

        } else {

            scoreCircle.classList.add(
                "score-danger"
            );
        }
    }


    /* =====================================================
       CALCULATE COMPLIANCE
       SINGLE SOURCE OF TRUTH
    ===================================================== */

    function calculateCompliance(
        saveFinalResult = false
    ) {

        const checks =
            buildChecks();


        const total =
            checks.length;


        const passed =
            checks.filter(
                check =>
                    check.status ===
                    "pass"
            ).length;


        const failed =
            checks.filter(
                check =>
                    check.status ===
                    "fail"
            ).length;


        const pending =
            checks.filter(
                check =>
                    check.status ===
                    "pending"
            ).length;


        /*
         * SCORE IS CALCULATED ONLY FROM
         * ACTUAL COMPLIANCE CHECKS.
         */

        const score =
            total > 0
                ? Math.round(
                    (
                        passed /
                        total
                    ) *
                    100
                )
                : 0;


        /* =================================================
           STATUS
        ================================================= */

        let status =
            "pending";


        if (
            pending === 0 &&
            failed === 0 &&
            total > 0
        ) {

            status =
                "compliant";

        } else if (
            pending === 0 &&
            failed > 0
        ) {

            status =
                "non-compliant";
        }


        /* =================================================
           UPDATE SCORE CIRCLE
        ================================================= */

        updateScoreCircle(
            score
        );


        /* =================================================
           UPDATE SCORE TEXT
        ================================================= */

        if (complianceScore) {

            complianceScore.textContent =
                `${score}%`;
        }


        /* =================================================
           VERIFICATION COUNT
        ================================================= */

        if (verificationCount) {

            verificationCount.textContent =
                `${passed} / ${total} PASSED`;
        }


        /* =================================================
           SCORE / STATUS MESSAGE
        ================================================= */

        if (pending > 0) {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "IN REVIEW";


                scoreBadge.className =
                    "score-badge pending";
            }


            if (scoreMessage) {

                scoreMessage.textContent =
                    `${passed} passed, ${failed} failed, ${pending} awaiting officer verification.`;
            }


            if (decisionText) {

                decisionText.textContent =
                    "Complete officer verification for all detected declarations before generating the final result.";
            }


        } else if (
            failed > 0
        ) {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "NON-COMPLIANT";


                scoreBadge.className =
                    "score-badge non-compliant";
            }


            if (scoreMessage) {

                scoreMessage.textContent =
                    `${failed} mandatory requirement(s) failed. Compliance score: ${score}%.`;
            }


            if (decisionText) {

                decisionText.textContent =
                    "One or more mandatory declarations are missing or non-compliant.";
            }


        } else if (
            total > 0
        ) {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "COMPLIANT";


                scoreBadge.className =
                    "score-badge compliant";
            }


            if (scoreMessage) {

                scoreMessage.textContent =
                    `All ${total} mandatory checklist items have been verified successfully.`;
            }


            if (decisionText) {

                decisionText.textContent =
                    "All mandatory declarations have been detected and verified by the officer.";
            }


        } else {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "NO DATA";


                scoreBadge.className =
                    "score-badge pending";
            }


            if (scoreMessage) {

                scoreMessage.textContent =
                    "No compliance checklist items are available.";
            }


            if (decisionText) {

                decisionText.textContent =
                    "AI data is not available. Please return to the Inspection page and complete the scan.";
            }
        }


        /* =================================================
           CALCULATED RESULT
        ================================================= */

        const calculated = {

            score,

            total,

            passed,

            failed,

            pending,

            checks,

            status
        };


        /*
         * Save ONLY when explicitly requested.
         *
         * Checkbox changes update UI only.
         */

        if (saveFinalResult) {

            saveComplianceResult(
                calculated
            );
        }


        console.log(
            "COMPLIANCE CALCULATION:",
            calculated
        );


        return calculated;
    }


    /* =====================================================
       INITIALIZE CHECKBOXES
    ===================================================== */

    ruleCheckboxes.forEach(
        checkbox => {

            const rule =
                checkbox.dataset.rule ||
                "";


            const detected =
                isRuleDetected(
                    rule
                );


            if (!detected) {

                checkbox.checked =
                    false;

                checkbox.disabled =
                    true;

            } else {

                checkbox.disabled =
                    false;
            }


            updateRuleVisualState(
                checkbox,
                detected
            );


            checkbox.addEventListener(
                "change",
                () => {

                    updateRuleVisualState(
                        checkbox,
                        isRuleDetected(
                            rule
                        )
                    );


                    /*
                     * Recalculate UI only.
                     * Do NOT save final result.
                     */

                    calculateCompliance(
                        false
                    );
                }
            );
        }
    );


    /* =====================================================
       OBSERVATION
    ===================================================== */

    if (observation) {

        /*
         * Do not automatically create a final
         * complianceResult while typing.
         *
         * Observation will be saved as part of
         * the final result.
         */

        observation.addEventListener(
            "input",
            () => {

                console.log(
                    "Observation updated."
                );
            }
        );
    }


    /* =====================================================
       GENERATE FINAL RESULT
    ===================================================== */

    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            () => {

                console.log(
                    "GENERATE RESULT CLICKED"
                );


                /* -------------------------------------------
                   FINAL CALCULATION
                ------------------------------------------- */

                const result =
                    calculateCompliance(
                        false
                    );


                /* -------------------------------------------
                   ID SAFETY
                ------------------------------------------- */

                if (!inspectionId) {

                    alert(
                        "Inspection ID is missing. Please return to the Inspection page and start the inspection again."
                    );


                    return;
                }


                /* -------------------------------------------
                   PENDING VERIFICATION
                ------------------------------------------- */

                if (
                    result.pending > 0
                ) {

                    alert(
                        "Please verify all detected declarations before generating the final result.\n\nPending verification: " +
                        result.pending
                    );


                    return;
                }


                /* -------------------------------------------
                   SAVE FINAL COMPLIANCE RESULT
                ------------------------------------------- */

                const finalResult =
                    saveComplianceResult(
                        result
                    );


                if (!finalResult) {

                    alert(
                        "Unable to save the final compliance result. Please try again."
                    );


                    return;
                }


                /*
                 * Add the latest observation to final result.
                 *
                 * saveComplianceResult() creates the object
                 * before this section, so update it safely.
                 */

                if (observation) {

                    finalResult.observation =
                        observation.value.trim();


                    safeSetStorageJSON(
                        localStorage,
                        "complianceResult",
                        finalResult
                    );
                }


                /* -------------------------------------------
                   UPDATE CURRENT INSPECTION
                ------------------------------------------- */

                try {

                    const savedCurrent =
                        localStorage.getItem(
                            "currentInspection"
                        );


                    let currentData =
                        savedCurrent
                            ? JSON.parse(
                                savedCurrent
                            )
                            : {};


                    if (
                        !currentData ||
                        typeof currentData !== "object" ||
                        Array.isArray(currentData)
                    ) {

                        currentData = {};
                    }


                    /* ---------------------------------------
                       PRESERVE INSPECTION ID
                    --------------------------------------- */

                    currentData.inspectionId =
                        inspectionId;


                    /* ---------------------------------------
                       PRESERVE PRODUCT DATA
                    --------------------------------------- */

                    currentData.product =
                        productData;


                    currentData.productName =
                        productData.productName;


                    currentData.manufacturer =
                        productData.manufacturer;


                    currentData.netQuantity =
                        productData.netQuantity;


                    currentData.mrp =
                        productData.mrp;


                    currentData.packingDate =
                        productData.packingDate;


                    currentData.consumerCare =
                        productData.consumerCare;


                    currentData.address =
                        productData.address;


                    currentData.additionalDeclarations =
                        productData.additionalDeclarations;


                    /* ---------------------------------------
                       PRESERVE AI RESULT
                    --------------------------------------- */

                    currentData.aiAnalysis =
                        aiAnalysis;


                    currentData.rawOCR =
                        rawOCR;


                    /* ---------------------------------------
                       PRESERVE FINAL COMPLIANCE RESULT
                    --------------------------------------- */

                    currentData.compliance =
                        finalResult;


                    /* ---------------------------------------
                       PRESERVE EVIDENCE METADATA
                    --------------------------------------- */

                    currentData.evidence =
                        evidenceInformation;


                    /* ---------------------------------------
                       TIMESTAMP
                    --------------------------------------- */

                    currentData.savedAt =
                        new Date().toISOString();


                    const currentSaved =
                        safeSetStorageJSON(
                            localStorage,
                            "currentInspection",
                            currentData
                        );


                    if (!currentSaved) {

                        console.warn(
                            "currentInspection could not be updated."
                        );

                    } else {

                        /*
                         * Keep in-memory copy aligned.
                         */

                        inspectionData =
                            currentData;
                    }


                } catch (error) {

                    console.warn(
                        "Unable to update currentInspection:",
                        error
                    );
                }


                /* -------------------------------------------
                   DEBUG LOG
                ------------------------------------------- */

                console.log(
                    "FINAL COMPLIANCE RESULT:",
                    localStorage.getItem(
                        "complianceResult"
                    )
                );


                console.log(
                    "FINAL CURRENT INSPECTION:",
                    localStorage.getItem(
                        "currentInspection"
                    )
                );


                console.log(
                    "FINAL EVIDENCE COUNT:",
                    evidenceRecords.length
                );


                /* -------------------------------------------
                   NAVIGATE TO RESULT PAGE
                ------------------------------------------- */

                window.location.href =
                    "result.html";
            }
        );

    } else {

        console.error(
            "generateBtn not found in compliance.html"
        );
    }


    /* =====================================================
       BACK
    ===================================================== */

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "inspection.html";
            }
        );
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) {
                    return;
                }


                /* -------------------------------------------
                   LOCAL STORAGE
                ------------------------------------------- */

                localStorage.removeItem(
                    "officerName"
                );

                localStorage.removeItem(
                    "officerId"
                );

                localStorage.removeItem(
                    "currentInspection"
                );

                localStorage.removeItem(
                    "complianceResult"
                );

                localStorage.removeItem(
                    "complianceAssessment"
                );

                localStorage.removeItem(
                    "inspectionDraft"
                );

                localStorage.removeItem(
                    "aiAnalysisResult"
                );

                localStorage.removeItem(
                    "currentInspectionId"
                );

                localStorage.removeItem(
                    "eParakhSavedInspectionMongoId"
                );

                localStorage.removeItem(
                    "eParakhSavedInspectionId"
                );


                /* -------------------------------------------
                   SESSION STORAGE
                ------------------------------------------- */

                sessionStorage.removeItem(
                    "eParakhCapturedImage"
                );

                sessionStorage.removeItem(
                    "aiAnalysisResult"
                );

                sessionStorage.removeItem(
                    "panelImages"
                );

                sessionStorage.removeItem(
                    "inspectionStarted"
                );

                sessionStorage.removeItem(
                    "eParakhEvidenceReady"
                );

                sessionStorage.removeItem(
                    "eParakhScanSource"
                );

                sessionStorage.removeItem(
                    "currentInspectionId"
                );

                sessionStorage.removeItem(
                    "eParakhStartNewInspection"
                );


                /* -------------------------------------------
                   DELETE CURRENT SCANNER DATABASE
                ------------------------------------------- */

                try {

                    const request =
                        indexedDB.deleteDatabase(
                            EVIDENCE_DB_NAME
                        );


                    request.onsuccess =
                        () => {

                            console.log(
                                "Scanner IndexedDB cleared on logout."
                            );


                            window.location.href =
                                "login.html";
                        };


                    request.onerror =
                        () => {

                            console.warn(
                                "Unable to clear scanner IndexedDB on logout."
                            );


                            window.location.href =
                                "login.html";
                        };


                    request.onblocked =
                        () => {

                            console.warn(
                                "Scanner IndexedDB deletion was blocked."
                            );


                            window.location.href =
                                "login.html";
                        };


                } catch (error) {

                    console.warn(
                        "IndexedDB cleanup failed:",
                        error
                    );


                    window.location.href =
                        "login.html";
                }
            }
        );
    }


    /* =====================================================
       INITIAL UI CALCULATION

       IMPORTANT:
       - Calculate UI only.
       - Do NOT overwrite final complianceResult.
    ===================================================== */

    const initialResult =
        calculateCompliance(
            false
        );


    /* =====================================================
       FINAL DEBUG INFORMATION
    ===================================================== */

    console.log(
        "======================================"
    );


    console.log(
        "COMPLIANCE READY"
    );


    console.log(
        "Inspection ID:",
        inspectionId
    );


    console.log(
        "Product:",
        productData
    );


    console.log(
        "AI Data:",
        aiData
    );


    console.log(
        "Evidence Images:",
        evidenceRecords.length
    );


    console.log(
        "Evidence:",
        evidenceRecords
    );


    console.log(
        "Initial Compliance:",
        initialResult
    );


    console.log(
        "======================================"
    );

});