document.addEventListener("DOMContentLoaded", () => {

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
       DEBUG START
    ===================================================== */

    console.log("======================================");
    console.log("e-PARAKH COMPLIANCE MODULE STARTED");
    console.log("======================================");


    /* =====================================================
       OFFICER DATA
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName") ||
        "Authorized Officer";

    const savedOfficerId =
        localStorage.getItem("officerId") ||
        "Officer ID";


    if (officerNameElement) {
        officerNameElement.textContent =
            savedOfficerName;
    }


    if (officerIdElement) {
        officerIdElement.textContent =
            savedOfficerId;
    }


    /* =====================================================
       OFFICER INITIALS
    ===================================================== */

    if (officerAvatar) {

        const words =
            savedOfficerName
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

    const savedInspection =
        localStorage.getItem("currentInspection");


    if (savedInspection) {

        try {

            inspectionData =
                JSON.parse(savedInspection);

            console.log(
                "CURRENT INSPECTION:",
                inspectionData
            );

        } catch (error) {

            console.error(
                "Unable to parse currentInspection:",
                error
            );

        }

    } else {

        console.warn(
            "currentInspection not found."
        );

    }


    /* =====================================================
       LOAD AI ANALYSIS
    ===================================================== */

    let aiAnalysis = {};

    const sessionAI =
        sessionStorage.getItem(
            "aiAnalysisResult"
        );

    const localAI =
        localStorage.getItem(
            "aiAnalysisResult"
        );


    /*
     * Priority:
     *
     * 1. sessionStorage
     * 2. currentInspection.aiAnalysis
     * 3. localStorage
     */

    const savedAI =
        sessionAI ||
        (
            inspectionData &&
            inspectionData.aiAnalysis
                ? JSON.stringify(
                    inspectionData.aiAnalysis
                )
                : null
        ) ||
        localAI;


    if (savedAI) {

        try {

            aiAnalysis =
                typeof savedAI === "string"
                    ? JSON.parse(savedAI)
                    : savedAI;

            console.log(
                "AI ANALYSIS LOADED:",
                aiAnalysis
            );

        } catch (error) {

            console.error(
                "Unable to parse AI analysis:",
                error
            );

        }

    } else {

        console.warn(
            "NO AI ANALYSIS FOUND."
        );

    }


    /* =====================================================
       NORMALIZE AI DATA
    ===================================================== */

    /*
     * AI service can return different structures.
     * We support all common structures.
     */

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


    /*
     * Some backend responses may put the
     * actual extracted data inside result.
     */

    if (
        Object.keys(aiData).length === 0 &&
        aiAnalysis &&
        aiAnalysis.result
    ) {

        aiData =
            aiAnalysis.result.extracted_data ||
            aiAnalysis.result.extractedData ||
            aiAnalysis.result.product ||
            aiAnalysis.result.data ||
            aiAnalysis.result ||
            {};

    }


    console.log(
        "NORMALIZED AI DATA:",
        aiData
    );


    /* =====================================================
       RAW OCR DEBUG
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

        return String(value)
            .trim()
            .length > 0;

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


    /*
     * Get first available value from
     * multiple possible AI field names.
     */

    function firstValue(...values) {

        for (const value of values) {

            if (valueExists(value)) {

                return cleanValue(value);

            }

        }

        return "";

    }


    /* =====================================================
       BUILD ADDITIONAL DECLARATIONS
    ===================================================== */

    function buildAdditionalDeclarations(data) {

        const additional = [];


        if (
            valueExists(data.brand_name)
        ) {

            additional.push(
                `Brand: ${cleanValue(data.brand_name)}`
            );

        }


        if (
            valueExists(data.brand_owner)
        ) {

            additional.push(
                `Brand Owner: ${cleanValue(data.brand_owner)}`
            );

        }


        if (
            valueExists(data.country_of_origin)
        ) {

            additional.push(
                `Country of Origin: ${cleanValue(data.country_of_origin)}`
            );

        }


        if (
            valueExists(data.fssai_license)
        ) {

            additional.push(
                `FSSAI License: ${cleanValue(data.fssai_license)}`
            );

        }


        if (
            valueExists(data.epr_registration)
        ) {

            additional.push(
                `EPR Registration: ${cleanValue(data.epr_registration)}`
            );

        }


        if (
            valueExists(data.batch_number)
        ) {

            additional.push(
                `Batch No.: ${cleanValue(data.batch_number)}`
            );

        }


        if (
            valueExists(data.use_by)
        ) {

            additional.push(
                `Use By: ${cleanValue(data.use_by)}`
            );

        }


        if (
            valueExists(data.ingredients)
        ) {

            additional.push(
                `Ingredients: ${cleanValue(data.ingredients)}`
            );

        }


        return additional.join("\n");

    }


    /* =====================================================
       NORMALIZE PRODUCT DATA
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
        localStorage.getItem(
            "currentInspectionId"
        );


    if (!inspectionId) {

        inspectionId =
            generateInspectionId();

    }


    function generateInspectionId() {

        const year =
            new Date().getFullYear();

        const random =
            String(Date.now()).slice(-6);

        return `EP-${year}-${random}`;

    }


    /*
     * Save generated ID so other pages
     * can use the same inspection ID.
     */

    localStorage.setItem(
        "currentInspectionId",
        inspectionId
    );


    if (inspectionIdElement) {

        inspectionIdElement.textContent =
            inspectionId;

    }


    /* =====================================================
       DISPLAY PRODUCT INFORMATION
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


    /* =====================================================
       DATA STATUS
    ===================================================== */

    const hasProductData =
        Object.values(productData)
            .some(value => valueExists(value));


    const hasAIData =
        Object.keys(aiData).length > 0;


    const hasInspectionData =
        Object.keys(inspectionData).length > 0;


    if (summaryStatus) {

        summaryStatus.textContent =
            (
                hasProductData ||
                hasAIData ||
                hasInspectionData
            )
                ? "DATA LOADED"
                : "NO DATA";

    }


    console.log(
        "DATA STATUS:",
        {
            hasProductData,
            hasAIData,
            hasInspectionData
        }
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


    /* =====================================================
       RULE VALUE
    ===================================================== */

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
       INITIALIZE CHECKLIST
    ===================================================== */

    ruleCheckboxes.forEach(
        checkbox => {

            const rule =
                checkbox.dataset.rule;


            const detected =
                isRuleDetected(rule);


            /*
             * Missing declaration:
             * disabled + unchecked
             */

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
                        isRuleDetected(rule)
                    );

                    calculateCompliance();

                }
            );

        }
    );


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


            if (status) {

                status.textContent =
                    "Missing";

            }


            return;

        }


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
                        .trim() ||
                    getRuleDisplayName(rule);


                const description =
                    ruleItem
                        ?.querySelector(
                            ".rule-content small"
                        )
                        ?.textContent
                        .trim() ||
                    getRuleDescription(rule);


                const detected =
                    isRuleDetected(rule);


                let status;


                /*
                 * Missing = FAIL
                 */

                if (!detected) {

                    status =
                        "fail";

                }


                /*
                 * Detected + checked = PASS
                 */

                else if (
                    checkbox.checked
                ) {

                    status =
                        "pass";

                }


                /*
                 * Detected but not verified
                 */

                else {

                    status =
                        "pending";

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
       FALLBACK RULE NAMES
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


        return names[rule] ||
            rule;

    }


    /* =====================================================
       FALLBACK RULE DESCRIPTIONS
    ===================================================== */

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


        return descriptions[rule] ||
            "Compliance requirement.";

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


        let score = 0;


        if (total > 0) {

            score =
                Math.round(
                    (
                        passed /
                        total
                    ) * 100
                );

        }


        /* =================================================
           COUNT
        ================================================= */

        if (verificationCount) {

            verificationCount.textContent =
                `${passed} / ${total} PASSED`;

        }


        /* =================================================
           SCORE
        ================================================= */

        if (complianceScore) {

            complianceScore.textContent =
                `${score}%`;

        }


        /* =================================================
           SCORE CIRCLE
        ================================================= */

        if (scoreCircle) {

            scoreCircle.style.setProperty(
                "--score",
                `${score}%`
            );

        }


        /* =================================================
           STATUS
        ================================================= */

        if (pending > 0) {

            setPendingState(
                passed,
                failed,
                pending,
                total
            );

        } else if (failed > 0) {

            setNonCompliantState(
                score,
                passed,
                failed,
                total
            );

        } else {

            setCompleteState(
                score,
                passed,
                total
            );

        }


        /* =================================================
           SAVE DRAFT
        ================================================= */

        saveComplianceDraft(
            score,
            passed,
            failed,
            pending,
            total,
            checks
        );


        console.log(
            "COMPLIANCE:",
            {
                score,
                total,
                passed,
                failed,
                pending
            }
        );

    }


    /* =====================================================
       PENDING STATE
    ===================================================== */

    function setPendingState(
        passed,
        failed,
        pending,
        total
    ) {

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

    }


    /* =====================================================
       NON-COMPLIANT STATE
    ===================================================== */

    function setNonCompliantState(
        score,
        passed,
        failed,
        total
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
                "One or more mandatory declarations are missing or non-compliant. A non-compliance result can be generated.";

        }

    }


    /* =====================================================
       COMPLETE STATE
    ===================================================== */

    function setCompleteState(
        score,
        passed,
        total
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
                "All mandatory declarations have been detected and verified by the officer. The inspection result can now be generated.";

        }

    }


    /* =====================================================
       GET EVIDENCE INFORMATION
    ===================================================== */

    function getEvidenceInformation() {

        /*
         * Scanner stores panel images in IndexedDB.
         * We don't block compliance if IndexedDB is
         * unavailable.
         */

        return {

            evidenceAvailable:
                false,

            evidenceCount:
                0,

            evidenceSource:
                "IndexedDB",

            evidenceLoadedAt:
                new Date().toISOString()

        };

    }


    /* =====================================================
       SAVE COMPLIANCE DRAFT
    ===================================================== */

    function saveComplianceDraft(
        score,
        passed,
        failed,
        pending,
        total,
        checks
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
                            check.description ||
                            "Mandatory declaration was not detected.",

                        extractedValue:
                            check.extractedValue || "",

                        rule:
                            check.rule

                    })
                );


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


        const complianceResult = {

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
                getEvidenceInformation(),

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
            JSON.stringify(
                complianceResult
            )
        );

    }


    /* =====================================================
       OBSERVATION AUTO SAVE
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


                /* =================================================
                   BLOCK PENDING
                ================================================= */

                if (pending > 0) {

                    alert(
                        `Please verify all detected declarations before generating the result.\n\nPending verification: ${pending}`
                    );

                    return;

                }


                /* =================================================
                   SCORE
                ================================================= */

                const score =
                    total > 0
                        ? Math.round(
                            (
                                passed /
                                total
                            ) * 100
                        )
                        : 0;


                /* =================================================
                   VIOLATIONS
                ================================================= */

                const violations =
                    checks
                        .filter(
                            check =>
                                check.status ===
                                "fail"
                        )
                        .map(
                            check => ({

                                title:
                                    check.name,

                                description:
                                    check.description ||
                                    "Mandatory declaration was not detected.",

                                extractedValue:
                                    check.extractedValue || "",

                                rule:
                                    check.rule

                            })
                        );


                /* =================================================
                   FINAL STATUS
                ================================================= */

                const status =
                    (
                        failed === 0 &&
                        passed === total &&
                        total > 0
                    )
                        ? "compliant"
                        : "non-compliant";


                /* =================================================
                   FINAL RESULT
                ================================================= */

                const finalResult = {

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
                        getEvidenceInformation(),

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


                /* =================================================
                   SAVE FINAL RESULT
                ================================================= */

                localStorage.setItem(
                    "complianceResult",
                    JSON.stringify(
                        finalResult
                    )
                );


                /*
                 * Also update currentInspection
                 * so result/report pages can access
                 * the complete inspection.
                 */

                try {

                    const current =
                        localStorage.getItem(
                            "currentInspection"
                        );


                    if (current) {

                        const currentData =
                            JSON.parse(current);


                        currentData.inspectionId =
                            inspectionId;

                        currentData.product =
                            productData;

                        currentData.aiAnalysis =
                            aiAnalysis;

                        currentData.compliance =
                            finalResult;


                        localStorage.setItem(
                            "currentInspection",
                            JSON.stringify(
                                currentData
                            )
                        );

                    }

                } catch (error) {

                    console.warn(
                        "Unable to update currentInspection:",
                        error
                    );

                }


                console.log(
                    "FINAL COMPLIANCE RESULT:",
                    finalResult
                );


                /* =================================================
                   GO TO RESULT
                ================================================= */

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
       BACK BUTTON
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


                /* LOCAL STORAGE */

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


                /* SESSION STORAGE */

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


                window.location.href =
                    "login.html";

            }
        );

    }


    /* =====================================================
       HELPER
    ===================================================== */

    function setText(
        element,
        value,
        fallback = "Not provided"
    ) {

        if (!element) {

            return;

        }


        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            element.textContent =
                value;

        } else {

            element.textContent =
                fallback;

        }

    }


    /* =====================================================
       INITIAL CALCULATION
    ===================================================== */

    calculateCompliance();


    /* =====================================================
       FINAL DEBUG SNAPSHOT
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
        "======================================"
    );

});