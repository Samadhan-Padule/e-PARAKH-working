/* =========================================================
   e-PARAKH
   RESULT + INSPECTION REPORT
   DISPLAY / REPORT ONLY

   IMPORTANT:
   - compliance.js is the SINGLE SOURCE OF TRUTH.
   - This file does NOT calculate compliance.
   - Evidence is loaded from IndexedDB:
       DB    = eParakhEvidenceDB
       Store = inspectionEvidence

   Current scanner storage format:
       key   = front / back / side / batch
       value = image DataURL string

   FLOW:
       inspection.js
            ↓
       compliance.js
            ↓
       complianceResult + currentInspection
            ↓
       result.js
            ↓
       MongoDB / Inspector History / Senior Dashboard
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


    /* =====================================================
       STORAGE HELPERS
    ===================================================== */

    function getJSON(
        key,
        fallback = null
    ) {

        try {

            const value =
                localStorage.getItem(key);


            if (!value) {

                return fallback;

            }


            return JSON.parse(value);

        } catch (error) {

            console.warn(
                `Unable to read localStorage "${key}"`,
                error
            );

            return fallback;

        }

    }


    function getSessionJSON(
        key,
        fallback = null
    ) {

        try {

            const value =
                sessionStorage.getItem(key);


            if (!value) {

                return fallback;

            }


            return JSON.parse(value);

        } catch (error) {

            console.warn(
                `Unable to read sessionStorage "${key}"`,
                error
            );

            return fallback;

        }

    }


    /* =====================================================
       CURRENT INSPECTION
       READ ONLY
    ===================================================== */

    const currentInspection =
        getJSON(
            "currentInspection",
            {}
        ) || {};


    /* =====================================================
       COMPLIANCE RESULT
       SINGLE SOURCE OF TRUTH = compliance.js
    ===================================================== */

    const complianceResult =
        getJSON(
            "complianceResult",
            null
        );


    const legacyComplianceResult =
        getJSON(
            "complianceAssessment",
            null
        );


    const complianceData =
        complianceResult ||
        legacyComplianceResult ||
        {};


    console.log(
        "RESULT PAGE - COMPLIANCE RESULT:",
        complianceData
    );


    /* =====================================================
       AI RESULT
       INSPECTION.JS USES:
       aiAnalysisResult
    ===================================================== */

    const aiResult =
        getSessionJSON(
            "aiAnalysisResult",
            null
        ) ||
        getJSON(
            "aiAnalysisResult",
            null
        ) ||
        getSessionJSON(
            "aiResult",
            null
        ) ||
        getJSON(
            "aiResult",
            null
        ) ||
        getSessionJSON(
            "aiExtraction",
            null
        ) ||
        getJSON(
            "aiExtraction",
            null
        ) ||
        currentInspection?.aiAnalysis ||
        null;


    const aiProduct =
        aiResult?.extracted_data ||
        aiResult?.extractedData ||
        aiResult?.product ||
        aiResult?.data ||
        aiResult?.extraction ||
        aiResult ||
        {};


    console.log(
        "RESULT PAGE - AI RESULT:",
        aiResult
    );


    /* =====================================================
       INSPECTION ID
       READ ONLY
       DO NOT GENERATE NEW ID
    ===================================================== */

    function getCurrentInspectionId() {

        /* 1. Primary localStorage value */
        const directId =
            localStorage.getItem(
                "currentInspectionId"
            );


        if (directId) {

            return String(
                directId
            )
                .trim()
                .toUpperCase();

        }


        /* 2. currentInspection.inspectionId */
        if (
            currentInspection?.inspectionId
        ) {

            return String(
                currentInspection.inspectionId
            )
                .trim()
                .toUpperCase();

        }


        /* 3. currentInspection.id */
        if (
            currentInspection?.id
        ) {

            return String(
                currentInspection.id
            )
                .trim()
                .toUpperCase();

        }


        /* 4. complianceData.inspectionId */
        if (
            complianceData?.inspectionId
        ) {

            return String(
                complianceData.inspectionId
            )
                .trim()
                .toUpperCase();

        }


        /* 5. sessionStorage fallback */
        const sessionId =
            sessionStorage.getItem(
                "currentInspectionId"
            );


        if (sessionId) {

            return String(
                sessionId
            )
                .trim()
                .toUpperCase();

        }


        return "";

    }


    const inspectionId =
        getCurrentInspectionId();


    console.log(
        "CURRENT INSPECTION ID:",
        inspectionId
    );


    /* =====================================================
       OFFICER
    ===================================================== */

    const officer =
        getJSON(
            "loggedInUser",
            null
        ) ||
        getJSON(
            "currentUser",
            null
        ) ||
        getJSON(
            "eParakhUser",
            null
        ) ||
        getJSON(
            "user",
            null
        ) ||
        {};


    const officerName =
        officer.name ||
        officer.fullName ||
        officer.full_name ||
        officer.username ||
        currentInspection.officerName ||
        currentInspection.inspectionOfficer ||
        complianceData.inspectionOfficer ||
        complianceData?.officer?.name ||
        "Legal Metrology Officer";


    const officerId =
        officer.id ||
        officer.officerId ||
        officer.officer_id ||
        officer.userId ||
        officer.user_id ||
        currentInspection.officerId ||
        currentInspection.officer_id ||
        complianceData.officerId ||
        complianceData.officer_id ||
        complianceData?.officer?.id ||
        "—";


    /* =====================================================
       GENERIC VALUE HELPER
    ===================================================== */

    function firstValue(...values) {

        for (
            const value of values
        ) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return String(
                    value
                ).trim();

            }

        }

        return "";

    }


    /* =====================================================
       PRODUCT NAME
    ===================================================== */

    function looksLikeWrongProductName(
        value
    ) {

        if (!value) {

            return true;

        }


        const text =
            String(value)
                .trim()
                .toLowerCase();


        const blockedPhrases = [

            "for external use only",
            "for external use",
            "external use only",
            "warning",
            "caution",
            "customer care",
            "consumer care",
            "net quantity",
            "net qty",
            "maximum retail price",
            "mrp",
            "batch",
            "batch no",
            "batch number",
            "manufactured by",
            "marketed by",
            "manufactured",
            "expiry",
            "use before",
            "ingredients",
            "directions for use"

        ];


        return blockedPhrases.some(
            phrase =>
                text === phrase ||
                text.includes(phrase)
        );

    }


    function firstValidProductName(
        ...values
    ) {

        for (
            const value of values
        ) {

            if (
                value &&
                !looksLikeWrongProductName(
                    value
                )
            ) {

                return String(
                    value
                ).trim();

            }

        }


        return "Packaged Commodity";

    }


    const productName =
        firstValidProductName(

            currentInspection?.product?.name,

            currentInspection?.product?.productName,

            currentInspection?.product?.product_name,

            currentInspection?.productName,

            currentInspection?.product_name,

            complianceData?.product?.name,

            complianceData?.product?.productName,

            complianceData?.product?.product_name,

            aiProduct?.name,

            aiProduct?.item_name,

            aiProduct?.itemName,

            aiProduct?.commodity,

            aiProduct?.commodity_name,

            aiProduct?.commodityName,

            aiProduct?.product_title,

            aiProduct?.productTitle,

            aiProduct?.extracted_data?.product_name

        );


    /* =====================================================
       MRP FORMAT
       DISPLAY ONLY
    ===================================================== */

    function formatMRP(value) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return "";

        }


        let text =
            String(value)
                .trim()
                .replace(/₹/g, "")
                .replace(
                    /\b(rs|inr)\b/gi,
                    ""
                )
                .replace(
                    /\s+/g,
                    ""
                );


        if (
            /^0\d+$/.test(text)
        ) {

            text =
                text.replace(
                    /^0+/,
                    ""
                );

        }


        const numeric =
            Number(
                text.replace(
                    /,/g,
                    ""
                )
            );


        if (
            Number.isFinite(
                numeric
            )
        ) {

            return (
                "₹" +
                numeric.toLocaleString(
                    "en-IN",
                    {
                        maximumFractionDigits:
                            2
                    }
                )
            );

        }


        return String(value).trim();

    }


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    const manufacturer =
        firstValue(

            currentInspection?.product?.manufacturer,

            currentInspection?.manufacturer,

            complianceData?.product?.manufacturer,

            complianceData?.manufacturer,

            aiProduct?.manufacturer,

            aiProduct?.manufacturer_name,

            aiProduct?.manufacturerName,

            aiProduct?.packer,

            aiProduct?.packer_name,

            aiProduct?.importer,

            aiProduct?.importer_name

        ) || "Not provided";


    const netQuantity =
        firstValue(

            currentInspection?.product?.netQuantity,

            currentInspection?.product?.net_quantity,

            currentInspection?.netQuantity,

            currentInspection?.net_quantity,

            complianceData?.product?.netQuantity,

            complianceData?.product?.net_quantity,

            complianceData?.netQuantity,

            complianceData?.net_quantity,

            aiProduct?.netQuantity,

            aiProduct?.net_quantity,

            aiProduct?.quantity,

            aiProduct?.net_weight

        ) || "Not provided";


    const rawMRP =
        firstValue(

            currentInspection?.product?.mrp,

            currentInspection?.mrp,

            complianceData?.product?.mrp,

            complianceData?.mrp,

            aiProduct?.mrp,

            aiProduct?.MRP,

            aiProduct?.maximumRetailPrice,

            aiProduct?.maximum_retail_price,

            aiProduct?.max_retail_price

        );


    const mrp =
        formatMRP(
            rawMRP
        ) ||
        "Not provided";


    const packingDate =
        firstValue(

            currentInspection?.product?.packingDate,

            currentInspection?.product?.packing_date,

            currentInspection?.packingDate,

            currentInspection?.packing_date,

            complianceData?.product?.packingDate,

            complianceData?.product?.packing_date,

            complianceData?.packingDate,

            complianceData?.packing_date,

            aiProduct?.packingDate,

            aiProduct?.packing_date,

            aiProduct?.dateOfPacking,

            aiProduct?.date_of_packing,

            aiProduct?.manufacturingDate,

            aiProduct?.manufacturing_date,

            aiProduct?.date_of_manufacture,

            aiProduct?.date_of_manufacturing

        ) || "Not provided";


    const address =
        firstValue(

            currentInspection?.product?.address,

            currentInspection?.address,

            complianceData?.product?.address,

            complianceData?.address,

            aiProduct?.address,

            aiProduct?.manufacturerAddress,

            aiProduct?.manufacturer_address,

            aiProduct?.packerAddress,

            aiProduct?.packer_address,

            aiProduct?.registered_address,

            aiProduct?.importer_address

        ) || "Not provided";


    const additionalDeclarations =
        firstValue(

            currentInspection?.product?.additionalDeclarations,

            currentInspection?.product?.additional_declarations,

            currentInspection?.additionalDeclarations,

            currentInspection?.additional_declarations,

            complianceData?.product?.additionalDeclarations,

            complianceData?.product?.additional_declarations,

            complianceData?.additionalDeclarations,

            aiProduct?.additionalDeclarations,

            aiProduct?.additional_declarations,

            aiProduct?.declarations

        ) || "Not provided";


    /* =====================================================
       CONSUMER CARE
    ===================================================== */

    const consumerCare =
        firstValue(

            currentInspection?.product?.consumerCare,

            currentInspection?.product?.consumer_care,

            currentInspection?.consumerCare,

            currentInspection?.consumer_care,

            complianceData?.product?.consumerCare,

            complianceData?.product?.consumer_care,

            complianceData?.consumerCare,

            aiProduct?.consumerCare,

            aiProduct?.consumer_care,

            aiProduct?.customerCare,

            aiProduct?.customer_care,

            aiProduct?.contact

        );


    const consumerCarePhone =
        firstValue(

            aiProduct?.consumerCarePhone,

            aiProduct?.consumer_care_phone,

            aiProduct?.customerCarePhone,

            aiProduct?.customer_care_phone,

            aiProduct?.phone

        );


    const consumerCareEmail =
        firstValue(

            aiProduct?.consumerCareEmail,

            aiProduct?.consumer_care_email,

            aiProduct?.customerCareEmail,

            aiProduct?.customer_care_email,

            aiProduct?.email

        );


    const consumerCareWebsite =
        firstValue(

            aiProduct?.consumerCareWebsite,

            aiProduct?.consumer_care_website,

            aiProduct?.customerCareWebsite,

            aiProduct?.customer_care_website,

            aiProduct?.website

        );


    let finalConsumerCare =
        consumerCare;


    if (
        !finalConsumerCare
    ) {

        const parts = [];


        if (
            consumerCarePhone
        ) {

            parts.push(
                `Phone: ${consumerCarePhone}`
            );

        }


        if (
            consumerCareEmail
        ) {

            parts.push(
                `Email: ${consumerCareEmail}`
            );

        }


        if (
            consumerCareWebsite
        ) {

            parts.push(
                `Website: ${consumerCareWebsite}`
            );

        }


        finalConsumerCare =
            parts.length
                ? parts.join("; ")
                : "Not provided";

    }


    /* =====================================================
       INSPECTION DATE
    ===================================================== */

    const inspectionDate =
        firstValue(

            currentInspection?.inspectionDate,

            currentInspection?.inspection_date,

            complianceData?.inspectionDate,

            complianceData?.inspection_date,

            currentInspection?.inspectedAt,

            complianceData?.generatedAt,

            new Date().toLocaleDateString(
                "en-IN"
            )

        );


    /* =====================================================
       BASIC DISPLAY
    ===================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            $(id);


        if (!element) {

            return;

        }


        element.textContent =
            value ||
            "Not provided";

    }


    setText(
        "inspectionId",
        inspectionId || "—"
    );


    setText(
        "productName",
        productName
    );


    setText(
        "manufacturer",
        manufacturer
    );


    setText(
        "netQuantity",
        netQuantity
    );


    setText(
        "mrp",
        mrp
    );


    setText(
        "inspectionDate",
        inspectionDate
    );


    setText(
        "inspectionOfficer",
        officerName
    );


    setText(
        "packingDate",
        packingDate
    );


    setText(
        "consumerCare",
        finalConsumerCare
    );


    setText(
        "address",
        address
    );


    setText(
        "additionalDeclarations",
        additionalDeclarations
    );


    /* =====================================================
       OFFICER HEADER
    ===================================================== */

    setText(
        "officerName",
        officerName
    );


    setText(
        "officerId",
        officerId
    );


    const officerAvatar =
        $("officerAvatar");


    if (officerAvatar) {

        const initials =
            officerName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(
                    name =>
                        name
                            .charAt(0)
                            .toUpperCase()
                )
                .join("");


        officerAvatar.textContent =
            initials ||
            "LM";

    }


    /* =====================================================
       COMPLIANCE DATA
       READ ONLY
       NO CALCULATION
    ===================================================== */

    const score =
        Number.isFinite(
            Number(
                complianceData?.score
            )
        )
            ? Number(
                complianceData.score
            )
            : 0;


    const total =
        Number.isFinite(
            Number(
                complianceData?.total
            )
        )
            ? Number(
                complianceData.total
            )
            : 0;


    const passed =
        Number.isFinite(
            Number(
                complianceData?.passed
            )
        )
            ? Number(
                complianceData.passed
            )
            : 0;


    const failed =
        Number.isFinite(
            Number(
                complianceData?.failed
            )
        )
            ? Number(
                complianceData.failed
            )
            : 0;


    const pending =
        Number.isFinite(
            Number(
                complianceData?.pending
            )
        )
            ? Number(
                complianceData.pending
            )
            : 0;


    const savedStatus =
        firstValue(
            complianceData?.status
        ) ||
        "NOT AVAILABLE";


    console.log(
        "COMPLIANCE DISPLAY VALUES:",
        {
            score,
            total,
            passed,
            failed,
            pending,
            status:
                savedStatus
        }
    );


    /* =====================================================
       FINAL ASSESSMENT
    ===================================================== */

    setText(
        "complianceScore",
        `${score}%`
    );


    const resultIcon =
        $("resultIcon");


    const resultTitle =
        $("resultTitle");


    const resultDescription =
        $("resultDescription");


    const normalizedStatus =
        String(
            savedStatus
        )
            .trim()
            .toUpperCase();


    const isCompliant =
        normalizedStatus ===
        "COMPLIANT";


    const isNonCompliant =
        normalizedStatus ===
            "NON-COMPLIANT" ||
        normalizedStatus ===
            "NON COMPLIANT" ||
        normalizedStatus ===
            "NON_COMPLIANT";


    if (resultIcon) {

        if (isCompliant) {

            resultIcon.textContent =
                "✓";

        } else if (isNonCompliant) {

            resultIcon.textContent =
                "!";

        } else {

            resultIcon.textContent =
                "—";

        }

    }


    if (resultTitle) {

        if (isCompliant) {

            resultTitle.textContent =
                "Product Compliant";

        } else if (isNonCompliant) {

            resultTitle.textContent =
                "Product Non-Compliant";

        } else {

            resultTitle.textContent =
                "Assessment Unavailable";

        }

    }


    if (resultDescription) {

        if (isCompliant) {

            resultDescription.textContent =
                "The declared product information has passed the applicable compliance checks.";

        } else if (isNonCompliant) {

            resultDescription.textContent =
                "The declared product information has one or more compliance requirements that require attention.";

        } else {

            resultDescription.textContent =
                "Compliance assessment data is not available.";

        }

    }


    /* =====================================================
       CHECK COUNT
    ===================================================== */

    const checkCount =
        $("checkCount");


    if (checkCount) {

        checkCount.textContent =
            `${passed} / ${total} PASSED`;

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       RENDER COMPLIANCE CHECKS
       DISPLAY ONLY
    ===================================================== */

    function renderChecks() {

        const container =
            $("checksList");


        if (!container) {

            return;

        }


        const checks =
            Array.isArray(
                complianceData?.checks
            )
                ? complianceData.checks
                : [];


        container.innerHTML =
            "";


        if (
            checks.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    No compliance checks available.
                </div>
            `;


            return;

        }


        checks.forEach(
            (
                check,
                index
            ) => {

                let isPassed =
                    false;


                /*
                 * Primary format.
                 */
                if (
                    typeof check?.passed ===
                    "boolean"
                ) {

                    isPassed =
                        check.passed;

                }


                /*
                 * Alternative format.
                 */
                else if (
                    typeof check?.pass ===
                    "boolean"
                ) {

                    isPassed =
                        check.pass;

                }


                /*
                 * Saved compliance.js format:
                 * status = pass / fail / pending
                 */
                else {

                    const status =
                        String(
                            check?.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    isPassed =
                        status ===
                            "pass" ||
                        status ===
                            "passed" ||
                        status ===
                            "compliant" ||
                        status ===
                            "true";

                }


                const name =
                    check?.name ||
                    check?.label ||
                    check?.requirement ||
                    check?.title ||
                    `Requirement ${
                        index + 1
                    }`;


                const message =
                    check?.message ||
                    check?.description ||
                    check?.details ||
                    (
                        isPassed
                            ? "Requirement verified."
                            : "Requirement not verified."
                    );


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    `check-item ${
                        isPassed
                            ? "pass"
                            : "fail"
                    }`;


                item.innerHTML = `
                    <div class="check-icon ${
                        isPassed
                            ? "pass"
                            : "fail"
                    }">
                        ${
                            isPassed
                                ? "✓"
                                : "✕"
                        }
                    </div>

                    <div class="check-content">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            ${escapeHtml(message)}
                        </span>

                    </div>

                    <div class="check-status ${
                        isPassed
                            ? "pass"
                            : "fail"
                    }">

                        ${
                            isPassed
                                ? "PASSED"
                                : "FAILED"
                        }

                    </div>
                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    /* =====================================================
       RENDER VIOLATIONS
       DISPLAY ONLY
    ===================================================== */

    function renderViolations() {

        const container =
            $("violationsList");


        if (!container) {

            return;

        }


        const violations =
            Array.isArray(
                complianceData?.violations
            )
                ? complianceData.violations
                : [];


        container.innerHTML =
            "";


        if (
            violations.length === 0
        ) {

            container.innerHTML = `
                <div class="no-violations">
                    No compliance violations recorded.
                </div>
            `;


            return;

        }


        violations.forEach(
            (
                violation,
                index
            ) => {

                const title =
                    violation?.title ||
                    violation?.name ||
                    violation?.requirement ||
                    violation?.rule ||
                    "Compliance Violation";


                const description =
                    violation?.description ||
                    violation?.message ||
                    violation?.details ||
                    "Mandatory requirement not satisfied.";


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "violation-item";


                item.innerHTML = `
                    <div class="violation-icon">
                        ${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}
                    </div>

                    <div class="violation-content">

                        <strong>
                            ${escapeHtml(title)}
                        </strong>

                        <p>
                            ${escapeHtml(
                                description
                            )}
                        </p>

                    </div>
                `;


                container.appendChild(
                    item
                );

            }
        );

    }


    /* =====================================================
       INDEXEDDB CONFIGURATION
    ===================================================== */

    const EVIDENCE_DB_NAME =
        "eParakhEvidenceDB";


    const EVIDENCE_STORE_NAME =
        "inspectionEvidence";


    /* =====================================================
       OPEN EVIDENCE DATABASE
    ===================================================== */

    function openEvidenceDB() {

        return new Promise(
            (
                resolve,
                reject
            ) => {

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


                /*
                 * Do not force a version.
                 * camera.js owns the DB version.
                 */
                const request =
                    indexedDB.open(
                        EVIDENCE_DB_NAME
                    );


                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error ||
                            new Error(
                                "Unable to open evidence database."
                            )
                        );

                    };


                request.onblocked =
                    () => {

                        reject(
                            new Error(
                                "IndexedDB request was blocked."
                            )
                        );

                    };

            }
        );

    }


    /* =====================================================
       GET EVIDENCE
    ===================================================== */

    async function getEvidenceImages() {

        let db = null;


        try {

            db =
                await openEvidenceDB();


            if (
                !db.objectStoreNames.contains(
                    EVIDENCE_STORE_NAME
                )
            ) {

                console.warn(
                    "Evidence store not found."
                );


                db.close();


                return [];

            }


            const images =
                await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

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


                        const results =
                            [];


                        request.onsuccess =
                            () => {

                                const cursor =
                                    request.result;


                                if (
                                    !cursor
                                ) {

                                    resolve(
                                        results
                                    );


                                    return;

                                }


                                const key =
                                    cursor.key;


                                const value =
                                    cursor.value;


                                /*
                                 * CURRENT FORMAT:
                                 *
                                 * key:
                                 * front/back/side/batch
                                 *
                                 * value:
                                 * DataURL string
                                 */
                                if (
                                    typeof value ===
                                        "string" &&
                                    value.trim()
                                ) {

                                    results.push({

                                        panel:
                                            String(
                                                key
                                            ),

                                        dataUrl:
                                            value.trim(),

                                        name:
                                            String(
                                                key
                                            )
                                                .trim()
                                                .toUpperCase() +
                                            " evidence",

                                        createdAt:
                                            Date.now()

                                    });

                                }


                                /*
                                 * Legacy/future object format.
                                 */
                                else if (
                                    value &&
                                    typeof value ===
                                        "object"
                                ) {

                                    const panel =
                                        value.panel ||
                                        value.category ||
                                        value.type ||
                                        String(
                                            key
                                        );


                                    results.push({

                                        ...value,

                                        panel:
                                            panel,

                                        createdAt:
                                            value.createdAt ||
                                            Date.now()

                                    });

                                }


                                cursor.continue();

                            };


                        request.onerror =
                            () => {

                                reject(
                                    request.error ||
                                    new Error(
                                        "Unable to read evidence."
                                    )
                                );

                            };


                        transaction.onerror =
                            () => {

                                reject(
                                    transaction.error ||
                                    new Error(
                                        "Evidence transaction failed."
                                    )
                                );

                            };

                    }
                );


            db.close();


            console.log(
                "RESULT PAGE - EVIDENCE IMAGES:",
                images
            );


            return sortEvidence(
                images
            );

        } catch (error) {

            console.error(
                "Unable to load inspection evidence:",
                error
            );


            if (db) {

                try {

                    db.close();

                } catch (_) {}

            }


            return [];

        }

    }


    /* =====================================================
       EVIDENCE SORT
    ===================================================== */

    function sortEvidence(
        images
    ) {

        const order = {

            FRONT: 1,
            BACK: 2,
            SIDE: 3,
            BATCH: 4,
            MRP: 4,
            MRP_PANEL: 4,
            TOP: 5,
            BOTTOM: 6,
            OTHER: 99

        };


        return [
            ...images
        ].sort(
            (
                a,
                b
            ) => {

                const panelA =
                    String(
                        a?.panel ||
                        a?.category ||
                        a?.type ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                const panelB =
                    String(
                        b?.panel ||
                        b?.category ||
                        b?.type ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                const orderA =
                    order[panelA] ||
                    99;


                const orderB =
                    order[panelB] ||
                    99;


                if (
                    orderA !==
                    orderB
                ) {

                    return (
                        orderA -
                        orderB
                    );

                }


                const dateA =
                    new Date(
                        a?.createdAt ||
                        0
                    ).getTime();


                const dateB =
                    new Date(
                        b?.createdAt ||
                        0
                    ).getTime();


                return (
                    dateA -
                    dateB
                );

            }
        );

    }


    /* =====================================================
       EVIDENCE SOURCE
    ===================================================== */

    function getEvidenceSource(
        image
    ) {

        if (!image) {

            return "";

        }


        /*
         * Direct DataURL.
         */
        if (
            typeof image ===
            "string"
        ) {

            return image.trim();

        }


        /*
         * Object-based source.
         */
        const directSource =
            image.dataUrl ||
            image.data ||
            image.imageData ||
            image.src ||
            image.url ||
            "";


        if (
            typeof directSource ===
                "string" &&
            directSource.trim()
        ) {

            return directSource.trim();

        }


        /*
         * Blob support.
         */
        const blob =
            image.blob ||
            image.file ||
            image.imageBlob ||
            image.imageFile;


        if (
            blob instanceof Blob
        ) {

            try {

                return URL.createObjectURL(
                    blob
                );

            } catch (error) {

                console.error(
                    "Unable to create image URL:",
                    error
                );

            }

        }


        return "";

    }


    /* =====================================================
       EVIDENCE LABEL
    ===================================================== */

    function formatEvidenceLabel(
        image
    ) {

        const panel =
            String(
                image?.panel ||
                image?.category ||
                image?.type ||
                "OTHER"
            )
                .trim()
                .toUpperCase();


        const labels = {

            FRONT:
                "FRONT VIEW",

            BACK:
                "BACK VIEW",

            SIDE:
                "SIDE VIEW",

            BATCH:
                "BATCH / MRP",

            MRP:
                "BATCH / MRP",

            MRP_PANEL:
                "MRP PANEL",

            TOP:
                "TOP VIEW",

            BOTTOM:
                "BOTTOM VIEW",

            OTHER:
                "EVIDENCE"

        };


        return (
            labels[panel] ||
            panel.replace(
                /_/g,
                " "
            )
        );

    }


    /* =====================================================
       RENDER EVIDENCE GALLERY
    ===================================================== */

    function renderEvidenceGallery(
        images
    ) {

        const gallery =
            $("evidenceGallery");


        const evidenceSection =
            $("evidenceSection");


        const evidenceCount =
            $("evidenceCount");


        if (!gallery) {

            return;

        }


        gallery.innerHTML =
            "";


        const evidenceImages =
            Array.isArray(
                images
            )
                ? images
                : [];


        if (evidenceCount) {

            evidenceCount.textContent =
                `${evidenceImages.length} ${
                    evidenceImages.length === 1
                        ? "Photo"
                        : "Photos"
                }`;

        }


        if (
            evidenceImages.length === 0
        ) {

            gallery.innerHTML = `
                <div class="empty-state evidence-missing">
                    No evidence photos were saved for this inspection.
                </div>
            `;


            if (evidenceSection) {

                evidenceSection.classList.add(
                    "no-evidence"
                );

            }


            return;

        }


        if (evidenceSection) {

            evidenceSection.classList.remove(
                "no-evidence"
            );

        }


        evidenceImages.forEach(
            (
                image,
                index
            ) => {

                const source =
                    getEvidenceSource(
                        image
                    );


                if (!source) {

                    return;

                }


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "evidence-card";


                const header =
                    document.createElement(
                        "div"
                    );


                header.className =
                    "evidence-header";


                const label =
                    document.createElement(
                        "strong"
                    );


                label.textContent =
                    formatEvidenceLabel(
                        image
                    );


                const number =
                    document.createElement(
                        "span"
                    );


                number.textContent =
                    `#${index + 1}`;


                header.appendChild(
                    label
                );


                header.appendChild(
                    number
                );


                const img =
                    document.createElement(
                        "img"
                    );


                img.className =
                    "evidence-image";


                img.src =
                    source;


                img.alt =
                    `${formatEvidenceLabel(
                        image
                    )} evidence`;


                img.loading =
                    "eager";


                img.decoding =
                    "async";


                const name =
                    document.createElement(
                        "div"
                    );


                name.className =
                    "evidence-name";


                name.textContent =
                    image.name ||
                    formatEvidenceLabel(
                        image
                    );


                card.appendChild(
                    header
                );


                card.appendChild(
                    img
                );


                card.appendChild(
                    name
                );


                gallery.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       WAIT FOR EVIDENCE IMAGES
    ===================================================== */

    function waitForEvidenceImages() {

        const images =
            Array.from(
                document.querySelectorAll(
                    "#evidenceGallery img"
                )
            );


        if (
            images.length === 0
        ) {

            return Promise.resolve();

        }


        return Promise.all(
            images.map(
                img => {

                    if (
                        img.complete
                    ) {

                        return Promise.resolve();

                    }


                    return new Promise(
                        resolve => {

                            img.addEventListener(
                                "load",
                                resolve,
                                {
                                    once: true
                                }
                            );


                            img.addEventListener(
                                "error",
                                resolve,
                                {
                                    once: true
                                }
                            );

                        }
                    );

                }
            )
        );

    }


    /* =====================================================
       BACKEND CONFIG
    ===================================================== */

    const API_BASE_URL =
        "http://localhost:5000/api";


    let inspectionSavePromise =
        null;


    /*
     * Holds evidence sources loaded during
     * result page initialization.
     *
     * This is deliberately stored in a
     * variable available to saveCompletedInspection().
     */
    let evidenceImagesForMongo =
        [];


    /* =====================================================
       GET AUTHENTICATED USER
    ===================================================== */

    async function getAuthenticatedUser() {

        const token =
            localStorage.getItem(
                "eParakhToken"
            );


        if (!token) {

            throw new Error(
                "Your login session has expired. Please login again."
            );

        }


        const response =
            await fetch(
                `${API_BASE_URL}/auth/me`,
                {
                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch (_) {

            data = {};

        }


        if (
            !response.ok
        ) {

            throw new Error(
                data.message ||
                "Unable to verify your login session."
            );

        }


        return (
            data.inspector ||
            data.user ||
            data.data ||
            {}
        );

    }


    /* =====================================================
       BUILD PRODUCT PAYLOAD
    ===================================================== */

    function buildProductPayload() {

        return {

            productName:
                productName !==
                    "Packaged Commodity"
                    ? productName
                    : "Packaged Commodity",


            manufacturer:
                manufacturer !==
                    "Not provided"
                    ? manufacturer
                    : "Not provided",


            netQuantity:
                netQuantity !==
                    "Not provided"
                    ? netQuantity
                    : "",


            mrp:
                rawMRP ||
                "",


            packingDate:
                packingDate !==
                    "Not provided"
                    ? packingDate
                    : "",


            consumerCare:
                finalConsumerCare !==
                    "Not provided"
                    ? finalConsumerCare
                    : "",


            address:
                address !==
                    "Not provided"
                    ? address
                    : "",


            additionalDeclarations:
                additionalDeclarations !==
                    "Not provided"
                    ? additionalDeclarations
                    : "",


            
                source:
    "SCAN",


            aiConfidence:
                Number.isFinite(
                    Number(
                        aiResult?.confidence
                    )
                )
                    ? Number(
                        aiResult.confidence
                    )
                    : null

        };

    }


    /* =====================================================
       NORMALIZE COMPLIANCE STATUS
       READ ONLY
    ===================================================== */

    function getSavedComplianceStatus() {

        const normalized =
            String(
                savedStatus ||
                ""
            )
                .trim()
                .toUpperCase();


        if (
            normalized ===
            "COMPLIANT"
        ) {

            return "COMPLIANT";

        }


        if (
            normalized ===
                "NON-COMPLIANT" ||
            normalized ===
                "NON COMPLIANT" ||
            normalized ===
                "NON_COMPLIANT"
        ) {

            return "NON_COMPLIANT";

        }


        if (
            normalized ===
            "WARNING"
        ) {

            return "WARNING";

        }


        return "PENDING";

    }


    /* =====================================================
       BUILD VIOLATIONS
       READ ONLY
    ===================================================== */

    function getSavedViolations() {

        const violations =
            Array.isArray(
                complianceData?.violations
            )
                ? complianceData.violations
                : [];


        return violations.map(
            violation => {

                const severityValue =
                    String(
                        violation?.severity ||
                        "MEDIUM"
                    )
                        .trim()
                        .toUpperCase();


                const allowedSeverity = [

                    "LOW",
                    "MEDIUM",
                    "HIGH",
                    "CRITICAL"

                ];


                return {

                    ruleCode:
                        String(
                            violation?.ruleCode ||
                            violation?.code ||
                            violation?.rule ||
                            ""
                        ).trim(),


                    title:
                        String(
                            violation?.title ||
                            violation?.name ||
                            violation?.requirement ||
                            violation?.rule ||
                            "Compliance Violation"
                        ).trim(),


                    description:
                        String(
                            violation?.description ||
                            violation?.message ||
                            violation?.details ||
                            "Mandatory requirement not satisfied."
                        ).trim(),


                    severity:
                        allowedSeverity.includes(
                            severityValue
                        )
                            ? severityValue
                            : "MEDIUM"

                };

            }
        );

    }


    /* =====================================================
       SAVE COMPLETED INSPECTION
    ===================================================== */

    async function saveCompletedInspection() {

        if (
            inspectionSavePromise
        ) {

            return inspectionSavePromise;

        }


        inspectionSavePromise =
            (async () => {

                /* ---------------------------------------------
                   TOKEN
                --------------------------------------------- */

                const token =
                    localStorage.getItem(
                        "eParakhToken"
                    );


                if (!token) {

                    throw new Error(
                        "Login session not found."
                    );

                }


                /* ---------------------------------------------
                   INSPECTION ID
                --------------------------------------------- */

                if (!inspectionId) {

                    throw new Error(
                        "Inspection ID is missing."
                    );

                }


                const normalizedInspectionId =
                    String(
                        inspectionId
                    )
                        .trim()
                        .toUpperCase();


                /* ---------------------------------------------
                   PREVENT DUPLICATE SAVE FOR SAME INSPECTION
                --------------------------------------------- */

                const previouslySavedInspectionId =
                    localStorage.getItem(
                        "eParakhSavedInspectionId"
                    );


                const previouslySavedMongoId =
                    localStorage.getItem(
                        "eParakhSavedInspectionMongoId"
                    );


                if (
                    previouslySavedMongoId &&
                    previouslySavedInspectionId &&
                    String(
                        previouslySavedInspectionId
                    )
                        .trim()
                        .toUpperCase() ===
                    normalizedInspectionId
                ) {

                    console.log(
                        "Inspection already saved:",
                        normalizedInspectionId,
                        previouslySavedMongoId
                    );


                    return {

                        _id:
                            previouslySavedMongoId,

                        inspectionId:
                            previouslySavedInspectionId,

                        status:
                            "COMPLETED",

                        alreadySaved:
                            true

                    };

                }


                /* ---------------------------------------------
                   VERIFY USER
                --------------------------------------------- */

                const authenticatedUser =
                    await getAuthenticatedUser();


                if (
                    authenticatedUser.role &&
                    authenticatedUser.role !==
                        "INSPECTOR"
                ) {

                    throw new Error(
                        "Only an Inspector can complete an inspection."
                    );

                }


                /* ---------------------------------------------
                   PRODUCT
                --------------------------------------------- */

                let productId =
                    currentInspection?.product?._id ||
                    currentInspection?.productId ||
                    currentInspection?.product_id ||
                    null;


                /*
                 * Create Product if there is no MongoDB Product ID.
                 */
                if (!productId) {

                    console.log(
                        "Creating product record..."
                    );


                    const productPayload =
                        buildProductPayload();


                    const productResponse =
                        await fetch(
                            `${API_BASE_URL}/products`,
                            {
                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`

                                },

                                body:
                                    JSON.stringify(
                                        productPayload
                                    )

                            }
                        );


                    let productData =
                        {};


                    try {

                        productData =
                            await productResponse.json();

                    } catch (_) {

                        productData =
                            {};

                    }


                    if (
                        !productResponse.ok
                    ) {

                        throw new Error(
                            productData.message ||
                            "Unable to save product."
                        );

                    }


                    productId =
                        productData?.product?._id ||
                        productData?.data?._id ||
                        productData?._id ||
                        null;


                    if (!productId) {

                        throw new Error(
                            "Product was created but its ID was not returned."
                        );

                    }


                    console.log(
                        "Product saved:",
                        productId
                    );

                }


                /* ---------------------------------------------
                   EVIDENCE
                --------------------------------------------- */

                const evidenceImages =
                    Array.isArray(
                        evidenceImagesForMongo
                    )
                        ? evidenceImagesForMongo
                        : [];


                /* ---------------------------------------------
                   FINAL INSPECTION PAYLOAD
                --------------------------------------------- */

                const inspectionPayload = {

                    inspectionId:
                        normalizedInspectionId,


                    product:
                        productId,


                    status:
                        "COMPLETED",


                    /*
                     * Taken directly from compliance.js result.
                     */
                    complianceStatus:
                        getSavedComplianceStatus(),


                    complianceScore:
                        score,


                    evidenceImages:
                        evidenceImages,


                    observations:
                        String(
                            currentInspection?.observations ||
                            currentInspection?.observation ||
                            complianceData?.observation ||
                            ""
                        ),


                    violations:
                        getSavedViolations(),


                    remarks:
                        String(
                            currentInspection?.remarks ||
                            complianceData?.remarks ||
                            ""
                        ),


                    inspectedAt:
                        new Date().toISOString()

                };


                console.log(
                    "================================="
                );


                console.log(
                    "Saving completed inspection:"
                );


                console.log(
                    inspectionPayload
                );


                console.log(
                    "Evidence count:",
                    evidenceImages.length
                );


                console.log(
                    "================================="
                );


                /* ---------------------------------------------
                   SAVE INSPECTION
                --------------------------------------------- */

                const inspectionResponse =
                    await fetch(
                        `${API_BASE_URL}/inspections`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify(
                                    inspectionPayload
                                )

                        }
                    );


                let inspectionData =
                    {};


                try {

                    inspectionData =
                        await inspectionResponse.json();

                } catch (_) {

                    inspectionData =
                        {};

                }


                if (
                    !inspectionResponse.ok
                ) {

                    throw new Error(
                        inspectionData.message ||
                        "Unable to save completed inspection."
                    );

                }


                const savedInspection =
                    inspectionData?.inspection ||
                    inspectionData?.data ||
                    inspectionData;


                if (
                    !savedInspection?._id
                ) {

                    throw new Error(
                        "Inspection was saved but no database ID was returned."
                    );

                }


                /* ---------------------------------------------
                   SAVE LOCAL REFERENCE
                --------------------------------------------- */

                localStorage.setItem(
                    "eParakhSavedInspectionMongoId",
                    String(
                        savedInspection._id
                    )
                );


                localStorage.setItem(
                    "eParakhSavedInspectionId",
                    String(
                        savedInspection.inspectionId ||
                        normalizedInspectionId
                    )
                );


                console.log(
                    "================================="
                );


                console.log(
                    "e-PARAKH INSPECTION SAVED"
                );


                console.log(
                    "Mongo ID:",
                    savedInspection._id
                );


                console.log(
                    "Inspection ID:",
                    savedInspection.inspectionId ||
                    normalizedInspectionId
                );


                console.log(
                    "Status:",
                    savedInspection.status
                );


                console.log(
                    "Senior Officer:",
                    savedInspection.seniorOfficer
                );


                console.log(
                    "================================="
                );


                return savedInspection;

            })();


        try {

            return await inspectionSavePromise;

        } finally {

            inspectionSavePromise =
                null;

        }

    }


    /* =====================================================
       BUTTONS
    ===================================================== */

    function setupButtons() {

        const newInspectionBtn =
            $("newInspectionBtn");


        const dashboardBtn =
            $("dashboardBtn");


        const reportBtn =
            $("reportBtn");


        const logoutBtn =
            $("logoutBtn");


        /* =================================================
           NEW INSPECTION
        ================================================= */

        if (
            newInspectionBtn
        ) {

            newInspectionBtn.addEventListener(
                "click",
                () => {

                    /*
                     * Do not clear IndexedDB here.
                     *
                     * camera.js will clear the old
                     * evidence when the new-inspection
                     * flag is detected.
                     */

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


                    localStorage.removeItem(
                        "currentInspection"
                    );


                    localStorage.removeItem(
                        "currentInspectionId"
                    );


                    localStorage.removeItem(
                        "complianceResult"
                    );


                    localStorage.removeItem(
                        "complianceAssessment"
                    );


                    localStorage.removeItem(
                        "eParakhSavedInspectionMongoId"
                    );


                    localStorage.removeItem(
                        "eParakhSavedInspectionId"
                    );


                    /*
                     * Tell camera.js:
                     * this is a completely new inspection.
                     */
                    sessionStorage.setItem(
                        "eParakhStartNewInspection",
                        "true"
                    );


                    window.location.href =
                        "scan.html";

                }
            );

        }


        /* =================================================
           DASHBOARD
        ================================================= */

        if (
            dashboardBtn
        ) {

            dashboardBtn.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "dashboard.html";

                }
            );

        }


        /* =================================================
           LOGOUT
        ================================================= */

        if (
            logoutBtn
        ) {

            logoutBtn.addEventListener(
                "click",
                () => {

                    localStorage.removeItem(
                        "loggedInUser"
                    );


                    localStorage.removeItem(
                        "currentUser"
                    );


                    localStorage.removeItem(
                        "user"
                    );


                    window.location.href =
                        "login.html";

                }
            );

        }


        /* =================================================
           GENERATE REPORT
        ================================================= */

        if (
            reportBtn
        ) {

            reportBtn.addEventListener(
                "click",
                async () => {

                    reportBtn.disabled =
                        true;


                    const originalText =
                        reportBtn.textContent;


                    reportBtn.textContent =
                        "Saving Report...";


                    try {

                        /*
                         * Wait for evidence image rendering.
                         */
                        await waitForEvidenceImages();


                        /*
                         * Save completed inspection
                         * to MongoDB.
                         */
                        await saveCompletedInspection();


                        /*
                         * Give browser one render cycle.
                         */
                        await new Promise(
                            resolve =>
                                requestAnimationFrame(
                                    resolve
                                )
                        );


                        /*
                         * Existing print behaviour.
                         */
                        window.print();

                    } catch (
                        error
                    ) {

                        console.error(
                            "Unable to save completed inspection:",
                            error
                        );


                        alert(
                            `Inspection report could not be saved.\n\n${
                                error.message ||
                                "Please try again."
                            }`
                        );

                    } finally {

                        reportBtn.disabled =
                            false;


                        reportBtn.textContent =
                            originalText;

                    }

                }
            );

        }

    }


    /* =====================================================
       BEFORE PRINT
    ===================================================== */

    window.addEventListener(
        "beforeprint",
        () => {

            document.title =
                `e-PARAKH Inspection Report - ${
                    inspectionId ||
                    "Report"
                }`;

        }
    );


    /* =====================================================
       AFTER PRINT
    ===================================================== */

    window.addEventListener(
        "afterprint",
        () => {

            document.title =
                "e-PARAKH";

        }
    );


    /* =====================================================
       INITIAL RENDER
    ===================================================== */

    async function initializeResultPage() {

        try {

            /*
             * Render saved compliance result.
             */
            renderChecks();


            renderViolations();


            /*
             * Load evidence from IndexedDB.
             */
            const evidenceImages =
                await getEvidenceImages();


            /*
             * Convert evidence to DataURL/source
             * for MongoDB persistence.
             */
            evidenceImagesForMongo =
                evidenceImages
                    .map(
                        image =>
                            getEvidenceSource(
                                image
                            )
                    )
                    .filter(Boolean);


            /*
             * Render evidence gallery.
             */
            renderEvidenceGallery(
                evidenceImages
            );


            /*
             * Setup buttons only after
             * all result data is ready.
             */
            setupButtons();


            /* =================================================
               FINAL DEBUG
            ================================================= */

            console.log(
                "================================="
            );


            console.log(
                "e-PARAKH RESULT PAGE READY"
            );


            console.log(
                "Inspection ID:",
                inspectionId
            );


            console.log(
                "Officer:",
                officerName
            );


            console.log(
                "Officer ID:",
                officerId
            );


            console.log(
                "Product:",
                productName
            );


            console.log(
                "Compliance:",
                `${score}%`
            );


            console.log(
                "Total:",
                total
            );


            console.log(
                "Passed:",
                passed
            );


            console.log(
                "Failed:",
                failed
            );


            console.log(
                "Pending:",
                pending
            );


            console.log(
                "Status:",
                savedStatus
            );


            console.log(
                "Evidence Photos:",
                evidenceImages.length
            );


            console.log(
                "Evidence Sources:",
                evidenceImagesForMongo.length
            );


            console.log(
                "================================="
            );


        } catch (error) {

            console.error(
                "Result page initialization failed:",
                error
            );


            /*
             * Make sure the page does not
             * remain stuck on "Loading evidence".
             */
            const gallery =
                $("evidenceGallery");


            if (gallery) {

                gallery.innerHTML = `
                    <div class="empty-state evidence-missing">
                        Unable to load inspection evidence.
                    </div>
                `;

            }


            setupButtons();

        }

    }


    /* =====================================================
       START RESULT PAGE
    ===================================================== */

    await initializeResultPage();


});