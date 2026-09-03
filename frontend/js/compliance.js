
document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       e-PARAKH COMPLIANCE MODULE
       N-IMAGE + AI + RULE ENGINE + EVIDENCE
    ===================================================== */

    console.log("======================================");
    console.log("e-PARAKH COMPLIANCE MODULE STARTED");
    console.log("======================================");

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const inspectionIdElement = document.getElementById("inspectionId");
    const officerNameElement = document.getElementById("officerName");
    const officerIdElement = document.getElementById("officerId");
    const officerAvatar = document.getElementById("officerAvatar");

    const summaryManufacturer = document.getElementById("summaryManufacturer");
    const summaryProductName = document.getElementById("summaryProductName");
    const summaryQuantity = document.getElementById("summaryQuantity");
    const summaryMrp = document.getElementById("summaryMrp");
    const summaryPackingDate = document.getElementById("summaryPackingDate");
    const summaryConsumerCare = document.getElementById("summaryConsumerCare");
    const summaryStatus = document.getElementById("summaryStatus");

    const complianceScore = document.getElementById("complianceScore");
    const scoreBadge = document.getElementById("scoreBadge");
    const scoreCircle = document.getElementById("scoreCircle");
    const scoreMessage = document.getElementById("scoreMessage");
    const verificationCount = document.getElementById("verificationCount");
    const observation = document.getElementById("observation");
    const decisionText = document.getElementById("decisionText");

    const generateBtn = document.getElementById("generateBtn");
    const backBtn = document.getElementById("backBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    /* =====================================================
       OFFICER
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName") ||
        "Authorized Officer";

    const savedOfficerId =
        localStorage.getItem("officerId") ||
        "Officer ID";

    if (officerNameElement) {
        officerNameElement.textContent = savedOfficerName;
    }

    if (officerIdElement) {
        officerIdElement.textContent = savedOfficerId;
    }

    if (officerAvatar) {

        const words = savedOfficerName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        let initials = "AO";

        if (words.length === 1) {
            initials = words[0]
                .substring(0, 2)
                .toUpperCase();
        } else if (words.length > 1) {
            initials = (
                words[0][0] +
                words[words.length - 1][0]
            ).toUpperCase();
        }

        officerAvatar.textContent = initials;
    }

    /* =====================================================
       LOAD CURRENT INSPECTION
    ===================================================== */

    let inspectionData = {};

    try {

        const savedInspection =
            localStorage.getItem("currentInspection");

        if (savedInspection) {

            inspectionData =
                JSON.parse(savedInspection);

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

    }

    /* =====================================================
       LOAD AI ANALYSIS
    ===================================================== */

    let aiAnalysis = {};

    try {

        const sessionAI =
            sessionStorage.getItem("aiAnalysisResult");

        const localAI =
            localStorage.getItem("aiAnalysisResult");

        let savedAI =
            sessionAI ||
            localAI ||
            null;

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
        Object.keys(aiData).length === 0 &&
        aiAnalysis &&
        aiAnalysis.result
    ) {

        const result =
            aiAnalysis.result;

        aiData =
            result.extracted_data ||
            result.extractedData ||
            result.product ||
            result.data ||
            result ||
            {};

    }

    console.log(
        "NORMALIZED AI DATA:",
        aiData
    );

    /* =====================================================
       RAW OCR
    ===================================================== */

    const rawOCR =
        aiAnalysis.raw_ocr_text ||
        aiAnalysis.rawOCRText ||
        aiAnalysis.ocr_text ||
        aiAnalysis.ocrText ||
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
            return Object.keys(value).length > 0;
        }

        return String(value).trim().length > 0;
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
                return JSON.stringify(value);
            } catch (error) {
                return "";
            }

        }

        return String(value).trim();
    }

    function firstValue(...values) {

        for (const value of values) {

            if (valueExists(value)) {
                return cleanValue(value);
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

        if (valueExists(value)) {
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

    function buildAdditionalDeclarations(data) {

        const additional = [];

        const fields = [
            ["brand_name", "Brand"],
            ["brand_owner", "Brand Owner"],
            ["country_of_origin", "Country of Origin"],
            ["fssai_license", "FSSAI License"],
            ["epr_registration", "EPR Registration"],
            ["batch_number", "Batch No."],
            ["use_by", "Use By"],
            ["ingredients", "Ingredients"]
        ];

        fields.forEach(([key, label]) => {

            if (valueExists(data[key])) {

                additional.push(
                    label +
                    ": " +
                    cleanValue(data[key])
                );

            }

        });

        return additional.join("\n");
    }

    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    const productData = {

        manufacturer:
            firstValue(
                inspectionData.manufacturer,
                inspectionData.manufacturerName,
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
                aiData.product_name,
                aiData.productName,
                aiData.name,
                aiData.commodity_name
            ),

        netQuantity:
            firstValue(
                inspectionData.netQuantity,
                inspectionData.net_quantity,
                aiData.net_quantity,
                aiData.netQuantity,
                aiData.quantity,
                aiData.net_weight
            ),

        mrp:
            firstValue(
                inspectionData.mrp,
                aiData.mrp,
                aiData.maximum_retail_price,
                aiData.max_retail_price
            ),

        packingDate:
            firstValue(
                inspectionData.packingDate,
                inspectionData.packing_date,
                aiData.date_of_manufacture,
                aiData.date_of_packing,
                aiData.packing_date,
                aiData.manufacturing_date,
                aiData.manufacture_date,
                aiData.date_of_manufacturing
            ),

        consumerCare:
            firstValue(
                inspectionData.consumerCare,
                inspectionData.customerCare,
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
                buildAdditionalDeclarations(aiData)
            )
    };

    console.log(
        "FINAL NORMALIZED PRODUCT DATA:",
        productData
    );

    /* =====================================================
       INSPECTION ID
    ===================================================== */

    let inspectionId =
        inspectionData.inspectionId ||
        inspectionData.inspection_id ||
        localStorage.getItem("currentInspectionId");

    if (
        !inspectionId ||
        inspectionId === "EP-2026-000000"
    ) {

        const year =
            new Date().getFullYear();

        const random =
            String(Date.now()).slice(-6);

        inspectionId =
            "EP-" +
            year +
            "-" +
            random;
    }

    localStorage.setItem(
        "currentInspectionId",
        inspectionId
    );

    if (inspectionIdElement) {
        inspectionIdElement.textContent =
            inspectionId;
    }

    /* =====================================================
       DISPLAY PRODUCT
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

        summaryStatus.textContent =
            (
                valueExists(productData.productName) ||
                valueExists(productData.manufacturer) ||
                Object.keys(aiData).length > 0
            )
                ? "DATA LOADED"
                : "NO AI DATA";

    }

    /* =====================================================
       INDEXEDDB
    ===================================================== */

    const PANEL_DB_NAME =
        "eParakhScannerDB";

    const PANEL_DB_VERSION =
        3;

    const PANEL_STORE_NAME =
        "panelImages";

    function openPanelDB() {

        return new Promise(
            (resolve, reject) => {

                const request =
                    indexedDB.open(
                        PANEL_DB_NAME,
                        PANEL_DB_VERSION
                    );

                request.onupgradeneeded =
                    event => {

                        const db =
                            event.target.result;

                        if (
                            !db.objectStoreNames.contains(
                                PANEL_STORE_NAME
                            )
                        ) {

                            const store =
                                db.createObjectStore(
                                    PANEL_STORE_NAME,
                                    {
                                        keyPath: "id"
                                    }
                                );

                            store.createIndex(
                                "panel",
                                "panel",
                                {
                                    unique: false
                                }
                            );

                        }

                    };

                request.onsuccess =
                    event => {

                        resolve(
                            event.target.result
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );
    }

    async function getAllEvidence() {

        try {

            const db =
                await openPanelDB();

            const records =
                await new Promise(
                    (resolve, reject) => {

                        const transaction =
                            db.transaction(
                                PANEL_STORE_NAME,
                                "readonly"
                            );

                        const store =
                            transaction.objectStore(
                                PANEL_STORE_NAME
                            );

                        const request =
                            store.getAll();

                        request.onsuccess =
                            () => {

                                resolve(
                                    request.result || []
                                );

                            };

                        request.onerror =
                            () => {

                                reject(
                                    request.error
                                );

                            };

                    }
                );

            db.close();

            return records;

        } catch (error) {

            console.warn(
                "Evidence loading failed:",
                error
            );

            return [];
        }
    }

    /* =====================================================
       LOAD ALL N IMAGES
    ===================================================== */

    const evidenceRecords =
        await getAllEvidence();

    console.log(
        "ALL SCANNED EVIDENCE:",
        evidenceRecords
    );

    console.log(
        "TOTAL EVIDENCE IMAGES:",
        evidenceRecords.length
    );

    const evidenceInformation = {

        evidenceAvailable:
            evidenceRecords.length > 0,

        evidenceCount:
            evidenceRecords.length,

        evidenceSource:
            "IndexedDB",

        panels:
            evidenceRecords.map(
                item => ({
                    id: item.id,
                    panel:
                        item.panel || "OTHER",
                    name:
                        item.name || "",
                    type:
                        item.type || "",
                    source:
                        item.source || "upload",
                    createdAt:
                        item.createdAt || null
                })
            ),

        evidenceLoadedAt:
            new Date().toISOString()
    };

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

            checkbox.checked = false;
            checkbox.disabled = true;

            if (status) {
                status.textContent =
                    "Missing";
            }

            return;
        }

        checkbox.disabled = false;

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
                    checkbox.dataset.rule;

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
                    getRuleDisplayName(rule);

                const description =
                    ruleItem
                        ?.querySelector(
                            ".rule-content small"
                        )
                        ?.textContent
                        ?.trim() ||
                    getRuleDescription(rule);

                const detected =
                    isRuleDetected(rule);

                let status;

                if (!detected) {

                    status = "fail";

                } else if (
                    checkbox.checked
                ) {

                    status = "pass";

                } else {

                    status = "pending";
                }

                return {

                    rule,
                    name,
                    description,
                    detected,

                    extractedValue:
                        getDetectedValue(rule),

                    officerVerified:
                        checkbox.checked,

                    status
                };
            }
        );
    }

    /* =====================================================
       INITIALIZE CHECKBOXES
    ===================================================== */

    ruleCheckboxes.forEach(
        checkbox => {

            const rule =
                checkbox.dataset.rule;

            const detected =
                isRuleDetected(rule);

            /*
             * IMPORTANT:
             * Missing fields stay unchecked.
             * Detected fields require officer verification.
             */

            if (!detected) {

                checkbox.checked = false;
                checkbox.disabled = true;

            } else {

                checkbox.disabled = false;

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
                        isRuleDetected(rule)
                    );

                    calculateCompliance();
                }
            );
        }
    );

    /* =====================================================
       SAVE COMPLIANCE RESULT
    ===================================================== */

    function saveComplianceResult(
        score,
        passed,
        failed,
        pending,
        total,
        checks,
        status
    ) {

        const violations =
            checks
                .filter(
                    check =>
                        check.status === "fail"
                )
                .map(
                    check => ({

                        title:
                            check.name,

                        description:
                            check.description,

                        extractedValue:
                            check.extractedValue || "",

                        rule:
                            check.rule
                    })
                );

        const result = {

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

        localStorage.setItem(
            "complianceResult",
            JSON.stringify(result)
        );

        console.log(
            "COMPLIANCE RESULT SAVED:",
            result
        );

        return result;
    }

    /* =====================================================
       CALCULATE COMPLIANCE
    ===================================================== */

    function calculateCompliance() {

        const checks =
            buildChecks();

        const total =
            checks.length;

        const passed =
            checks.filter(
                check =>
                    check.status === "pass"
            ).length;

        const failed =
            checks.filter(
                check =>
                    check.status === "fail"
            ).length;

        const pending =
            checks.filter(
                check =>
                    check.status === "pending"
            ).length;

        const score =
            total > 0
                ? Math.round(
                    (passed / total) * 100
                )
                : 0;

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
           UI
        ================================================= */

        if (verificationCount) {

            verificationCount.textContent =
                passed +
                " / " +
                total +
                " PASSED";
        }

        if (complianceScore) {

            complianceScore.textContent =
                score + "%";
        }

        if (scoreCircle) {

            scoreCircle.style.setProperty(
                "--score",
                score + "%"
            );
        }

        if (pending > 0) {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "IN REVIEW";

                scoreBadge.className =
                    "score-badge pending";
            }

            if (scoreMessage) {

                scoreMessage.textContent =
                    passed +
                    " passed, " +
                    failed +
                    " failed, " +
                    pending +
                    " awaiting officer verification.";
            }

            if (decisionText) {

                decisionText.textContent =
                    "Complete officer verification for all detected declarations before generating the final result.";
            }

        } else if (failed > 0) {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "NON-COMPLIANT";

                scoreBadge.className =
                    "score-badge non-compliant";
            }

            if (scoreMessage) {

                scoreMessage.textContent =
                    failed +
                    " mandatory requirement(s) failed. Compliance score: " +
                    score +
                    "%.";
            }

            if (decisionText) {

                decisionText.textContent =
                    "One or more mandatory declarations are missing or non-compliant.";
            }

        } else {

            if (scoreBadge) {

                scoreBadge.textContent =
                    "COMPLIANT";

                scoreBadge.className =
                    "score-badge compliant";
            }

            if (scoreMessage) {

                scoreMessage.textContent =
                    "All " +
                    total +
                    " mandatory checklist items have been verified successfully.";
            }

            if (decisionText) {

                decisionText.textContent =
                    "All mandatory declarations have been detected and verified by the officer.";
            }
        }

        saveComplianceResult(
            score,
            passed,
            failed,
            pending,
            total,
            checks,
            status
        );

        console.log(
            "COMPLIANCE:",
            {
                score,
                total,
                passed,
                failed,
                pending,
                evidence:
                    evidenceRecords.length
            }
        );

        return {
            score,
            total,
            passed,
            failed,
            pending,
            checks,
            status
        };
    }

    /* =====================================================
       OBSERVATION
    ===================================================== */

    if (observation) {

        observation.addEventListener(
            "input",
            () => {

                const saved =
                    localStorage.getItem(
                        "complianceResult"
                    );

                if (!saved) {
                    return;
                }

                try {

                    const data =
                        JSON.parse(saved);

                    data.observation =
                        observation.value.trim();

                    localStorage.setItem(
                        "complianceResult",
                        JSON.stringify(data)
                    );

                } catch (error) {

                    console.error(
                        "Unable to save observation:",
                        error
                    );
                }
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

                const result =
                    calculateCompliance();

                if (result.pending > 0) {

                    alert(
                        "Please verify all detected declarations before generating the final result.\n\nPending verification: " +
                        result.pending
                    );

                    return;
                }

                /*
                 * Update currentInspection
                 */

                try {

                    const savedCurrent =
                        localStorage.getItem(
                            "currentInspection"
                        );

                    let currentData =
                        savedCurrent
                            ? JSON.parse(savedCurrent)
                            : {};

                    currentData.inspectionId =
                        inspectionId;

                    currentData.product =
                        productData;

                    currentData.aiAnalysis =
                        aiAnalysis;

                    currentData.rawOCR =
                        rawOCR;

                    currentData.compliance =
                        JSON.parse(
                            localStorage.getItem(
                                "complianceResult"
                            )
                        );

                    currentData.evidence =
                        evidenceInformation;

                    localStorage.setItem(
                        "currentInspection",
                        JSON.stringify(
                            currentData
                        )
                    );

                } catch (error) {

                    console.warn(
                        "Unable to update currentInspection:",
                        error
                    );
                }

                console.log(
                    "FINAL COMPLIANCE RESULT:",
                    localStorage.getItem(
                        "complianceResult"
                    )
                );

                /*
                 * Navigate to result page
                 */

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
                    "inspectionDraft"
                );

                localStorage.removeItem(
                    "aiAnalysisResult"
                );

                localStorage.removeItem(
                    "currentInspectionId"
                );

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

                /*
                 * Clear IndexedDB
                 */

                try {

                    const request =
                        indexedDB.deleteDatabase(
                            PANEL_DB_NAME
                        );

                    request.onsuccess =
                        () => {

                            console.log(
                                "Scanner IndexedDB cleared."
                            );

                            window.location.href =
                                "login.html";
                        };

                    request.onerror =
                        () => {

                            window.location.href =
                                "login.html";
                        };

                } catch (error) {

                    window.location.href =
                        "login.html";
                }
            }
        );
    }

    /* =====================================================
       INITIAL CALCULATION
    ===================================================== */

    const initialResult =
        calculateCompliance();

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
        "Initial Compliance:",
        initialResult
    );

    console.log(
        "======================================"
    );

});
