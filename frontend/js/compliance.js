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
                .split(/\s+/);

        let initials = "AO";

        if (words.length === 1) {

            initials =
                words[0]
                    .substring(0, 2)
                    .toUpperCase();

        } else {

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
       LOAD INSPECTION DATA
    ===================================================== */

    let inspectionData = {};

    const savedInspection =
        localStorage.getItem("currentInspection");


    if (savedInspection) {

        try {

            inspectionData =
                JSON.parse(savedInspection);

        } catch (error) {

            console.error(
                "Unable to parse inspection data:",
                error
            );

        }

    }


    /* =====================================================
       LOAD AI ANALYSIS
    ===================================================== */

    let aiAnalysis = {};

    const savedAI =
        localStorage.getItem("aiAnalysisResult");


    if (savedAI) {

        try {

            aiAnalysis =
                JSON.parse(savedAI);

        } catch (error) {

            console.error(
                "Unable to parse AI analysis:",
                error
            );

        }

    }


    /* =====================================================
       NORMALIZE AI DATA
    ===================================================== */

    const aiData =
        aiAnalysis.extracted_data ||
        aiAnalysis.extractedData ||
        aiAnalysis.product ||
        aiAnalysis.data ||
        aiAnalysis ||
        {};


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

        return String(value).trim() !== "";
    }


    function cleanValue(value) {

        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }

        return String(value).trim();
    }


    /* =====================================================
       NORMALIZE INSPECTION DATA
    ===================================================== */

    const productData = {

        manufacturer:
            cleanValue(
                inspectionData.manufacturer ||
                aiData.manufacturer ||
                ""
            ),

        productName:
            cleanValue(
                inspectionData.productName ||
                aiData.product_name ||
                ""
            ),

        netQuantity:
            cleanValue(
                inspectionData.netQuantity ||
                aiData.net_quantity ||
                ""
            ),

        mrp:
            cleanValue(
                inspectionData.mrp ||
                aiData.mrp ||
                ""
            ),

        packingDate:
            cleanValue(
                inspectionData.packingDate ||
                aiData.date_of_manufacture ||
                aiData.packing_date ||
                aiData.date_of_packing ||
                ""
            ),

        consumerCare:
            cleanValue(
                inspectionData.consumerCare ||
                aiData.customer_care ||
                ""
            ),

        address:
            cleanValue(
                inspectionData.address ||
                aiData.manufacturer_address ||
                aiData.address ||
                ""
            ),

        additionalDeclarations:
            cleanValue(
                inspectionData.additionalDeclarations ||
                buildAdditionalDeclarations(aiData)
            )

    };


    /* =====================================================
       BUILD ADDITIONAL DECLARATIONS
    ===================================================== */

    function buildAdditionalDeclarations(data) {

        const additional = [];

        if (valueExists(data.brand_name)) {
            additional.push(
                `Brand: ${data.brand_name}`
            );
        }

        if (valueExists(data.brand_owner)) {
            additional.push(
                `Brand Owner: ${data.brand_owner}`
            );
        }

        if (valueExists(data.country_of_origin)) {
            additional.push(
                `Country of Origin: ${data.country_of_origin}`
            );
        }

        if (valueExists(data.fssai_license)) {
            additional.push(
                `FSSAI License: ${data.fssai_license}`
            );
        }

        if (valueExists(data.epr_registration)) {
            additional.push(
                `EPR Registration: ${data.epr_registration}`
            );
        }

        if (valueExists(data.batch_number)) {
            additional.push(
                `Batch No.: ${data.batch_number}`
            );
        }

        if (valueExists(data.use_by)) {
            additional.push(
                `Use By: ${data.use_by}`
            );
        }

        if (valueExists(data.ingredients)) {
            additional.push(
                `Ingredients: ${data.ingredients}`
            );
        }

        return additional.join("\n");
    }


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    let inspectionId =
        inspectionData.inspectionId;


    if (!inspectionId) {

        inspectionId =
            generateInspectionId();

    }


    if (inspectionIdElement) {

        inspectionIdElement.textContent =
            inspectionId;

    }


    function generateInspectionId() {

        const year =
            new Date().getFullYear();

        const random =
            String(Date.now()).slice(-6);

        return `EP-${year}-${random}`;
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

    const hasInspectionData =
        Object.keys(inspectionData).length > 0 ||
        Object.keys(aiData).length > 0;


    if (summaryStatus) {

        summaryStatus.textContent =
            hasInspectionData
                ? "DATA LOADED"
                : "NO DATA";

    }


    /* =====================================================
       CHECKBOXES
    ===================================================== */

    const ruleCheckboxes =
        document.querySelectorAll(
            ".rule-checkbox"
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
       RULE DEFINITIONS
    ===================================================== */

    const RULE_DEFINITIONS = {

        manufacturer: {
            required: true
        },

        productName: {
            required: true
        },

        quantity: {
            required: true
        },

        mrp: {
            required: true
        },

        date: {
            required: true
        },

        consumerCare: {
            required: true
        },

        address: {
            required: true
        },

        additional: {
            required: false
        }

    };


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
             * IMPORTANT:
             *
             * Missing declaration cannot be
             * marked as verified.
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

        if (!ruleItem) return;


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
        ).map(checkbox => {

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
                rule;


            const description =
                ruleItem
                    ?.querySelector(
                        ".rule-content small"
                    )
                    ?.textContent
                    .trim() ||
                "";


            const detected =
                isRuleDetected(rule);


            let status;


            /*
             * Missing = automatic failure.
             */

            if (!detected) {

                status = "fail";

            }

            /*
             * Detected + officer checked = pass.
             */

            else if (checkbox.checked) {

                status = "pass";

            }

            /*
             * Detected but officer has
             * not verified yet.
             */

            else {

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

        });

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


        /*
         * Score is based on actual
         * passed mandatory checks.
         */

        let score = 0;


        if (total > 0) {

            score =
                Math.round(
                    (passed / total) * 100
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
                            check.extractedValue || ""

                    })
                );


        let status = "pending";


        if (
            pending === 0 &&
            failed === 0 &&
            total > 0
        ) {

            status = "compliant";

        } else if (
            pending === 0 &&
            failed > 0
        ) {

            status = "non-compliant";

        }


        const complianceResult = {

            inspectionId,

            score,

            total,

            passed,

            failed,

            pending,

            status,

            checks,

            violations,

            product:
                productData,

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

                if (!saved) return;


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
       GENERATE RESULT
    ===================================================== */

    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            () => {

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


                /*
                 * Do not allow final result
                 * while officer verification
                 * is incomplete.
                 */

                if (pending > 0) {

                    alert(
                        `Please verify all detected declarations before generating the result.\n\nPending verification: ${pending}`
                    );

                    return;

                }


                /*
                 * Calculate actual score.
                 */

                const score =
                    total > 0
                        ? Math.round(
                            (passed / total) * 100
                        )
                        : 0;


                /*
                 * Missing declarations
                 * become violations.
                 */

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
                                    check.extractedValue || ""

                            })
                        );


                /*
                 * Final compliance status.
                 */

                const status =
                    failed === 0 &&
                    passed === total &&
                    total > 0
                        ? "compliant"
                        : "non-compliant";


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
                        finalResult
                    )
                );


                /*
                 * Go to result page.
                 */

                window.location.href =
                    "result.html";

            }
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


                if (!confirmed) return;


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

        if (!element) return;


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

});