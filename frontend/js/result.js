/* =========================================================
   e-PARAKH — FINAL INSPECTION RESULT JS
   STEP 04 — FINAL RESULT + EVIDENCE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const officerNameEl =
        document.getElementById("officerName");

    const officerIdEl =
        document.getElementById("officerId");

    const officerAvatarEl =
        document.getElementById("officerAvatar");

    const inspectionIdEl =
        document.getElementById("inspectionId");

    const resultIcon =
        document.getElementById("resultIcon");

    const resultTitle =
        document.getElementById("resultTitle");

    const resultDescription =
        document.getElementById("resultDescription");

    const complianceScore =
        document.getElementById("complianceScore");

    const productNameEl =
        document.getElementById("productName");

    const manufacturerEl =
        document.getElementById("manufacturer");

    const netQuantityEl =
        document.getElementById("netQuantity");

    const mrpEl =
        document.getElementById("mrp");

    const packingDateEl =
        document.getElementById("packingDate");

    const consumerCareEl =
        document.getElementById("consumerCare");

    const addressEl =
        document.getElementById("address");

    const additionalDeclarationsEl =
        document.getElementById(
            "additionalDeclarations"
        );

    const inspectionDateEl =
        document.getElementById(
            "inspectionDate"
        );

    const inspectionOfficerEl =
        document.getElementById(
            "inspectionOfficer"
        );

    const checksList =
        document.getElementById("checksList");

    const checkCount =
        document.getElementById("checkCount");

    const violationsList =
        document.getElementById(
            "violationsList"
        );

    const reportBtn =
        document.getElementById("reportBtn");

    const newInspectionBtn =
        document.getElementById(
            "newInspectionBtn"
        );

    const dashboardBtn =
        document.getElementById(
            "dashboardBtn"
        );

    const logoutBtn =
        document.getElementById("logoutBtn");


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
                String(value).trim();

        } else {

            element.textContent =
                fallback;

        }

    }


    function safeParse(value) {

        if (!value) return {};

        try {

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "JSON parse error:",
                error
            );

            return {};

        }

    }


    /* =====================================================
       OFFICER
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName") ||
        "Authorized Officer";

    const savedOfficerId =
        localStorage.getItem("officerId") ||
        "Officer ID";


    setText(
        officerNameEl,
        savedOfficerName,
        "Authorized Officer"
    );

    setText(
        officerIdEl,
        savedOfficerId,
        "Officer ID"
    );


    if (officerAvatarEl) {

        const initials =
            savedOfficerName
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map(word =>
                    word.charAt(0)
                )
                .join("")
                .substring(0, 2)
                .toUpperCase();

        officerAvatarEl.textContent =
            initials || "AO";

    }


    /* =====================================================
       LOAD INSPECTION
    ===================================================== */

    const inspectionData =
        safeParse(
            localStorage.getItem(
                "currentInspection"
            )
        );


    /* =====================================================
       LOAD AI DATA
    ===================================================== */

    const aiAnalysis =
        safeParse(
            localStorage.getItem(
                "aiAnalysisResult"
            )
        );


    const aiData =
        aiAnalysis.extracted_data ||
        aiAnalysis.extractedData ||
        aiAnalysis.product ||
        aiAnalysis.data ||
        aiAnalysis ||
        {};


    /* =====================================================
       LOAD COMPLIANCE
    ===================================================== */

    let complianceData =
        safeParse(
            localStorage.getItem(
                "complianceResult"
            )
        );


    if (
        !complianceData ||
        Object.keys(complianceData).length === 0
    ) {

        complianceData =
            safeParse(
                localStorage.getItem(
                    "complianceAssessment"
                )
            );

    }


    /* =====================================================
       PRODUCT DATA NORMALIZATION
    ===================================================== */

    /*
     * Priority:
     *
     * currentInspection
     * ↓
     * complianceResult.product
     * ↓
     * AI extracted data
     */

    const savedProduct =
        complianceData.product ||
        {};


    function firstValue(...values) {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return String(value).trim();

            }

        }

        return "";

    }


    /* =====================================================
       INVALID OCR PRODUCT NAME DETECTION
    ===================================================== */

    function looksLikeWrongProductName(value) {

        if (!value) return true;

        const text =
            String(value)
                .trim()
                .toLowerCase();


        const suspiciousWords = [

            "refund",
            "returned",
            "return",
            "condition",
            "customer",
            "please",
            "keep",
            "store",
            "storage",
            "instruction",
            "instructions",
            "consume",
            "best before",
            "manufactured by",
            "packed by",
            "ingredients",
            "per kg",
            "per kilogram"

        ];


        const hasSuspiciousWord =
            suspiciousWords.some(
                word =>
                    text.includes(word)
            );


        const looksLikeSentence =
            text.length > 70 ||
            text.split(" ").length > 12;


        return (
            hasSuspiciousWord ||
            looksLikeSentence
        );

    }


    let productName =
        firstValue(
            inspectionData.productName,
            savedProduct.productName,
            aiData.product_name,
            aiData.productName,
            aiData.name
        );


    /*
     * Prevent OCR sentence from appearing
     * as product name.
     */

    if (
        looksLikeWrongProductName(
            productName
        )
    ) {

        const alternative =
            firstValue(
                savedProduct.name,
                aiData.commodity_name,
                aiData.commodityName,
                aiData.product
            );


        if (
            alternative &&
            !looksLikeWrongProductName(
                alternative
            )
        ) {

            productName =
                alternative;

        } else {

            productName = "";

        }

    }


    const productData = {

        productName,

        manufacturer:
            firstValue(
                inspectionData.manufacturer,
                savedProduct.manufacturer,
                aiData.manufacturer,
                aiData.manufacturer_name,
                aiData.packer,
                aiData.importer
            ),

        netQuantity:
            firstValue(
                inspectionData.netQuantity,
                savedProduct.netQuantity,
                aiData.net_quantity,
                aiData.netQuantity,
                aiData.quantity
            ),

        mrp:
            firstValue(
                inspectionData.mrp,
                savedProduct.mrp,
                aiData.mrp,
                aiData.maximum_retail_price
            ),

        packingDate:
            firstValue(
                inspectionData.packingDate,
                savedProduct.packingDate,
                aiData.packing_date,
                aiData.date_of_manufacture,
                aiData.dateOfManufacture,
                aiData.month_year
            ),

        consumerCare:
            firstValue(
                inspectionData.consumerCare,
                savedProduct.consumerCare,
                aiData.customer_care,
                aiData.consumer_care,
                aiData.consumerCare
            ),

        address:
            firstValue(
                inspectionData.address,
                savedProduct.address,
                aiData.manufacturer_address,
                aiData.manufacturerAddress,
                aiData.address,
                aiData.complete_address
            ),

        additionalDeclarations:
            firstValue(
                inspectionData.additionalDeclarations,
                savedProduct.additionalDeclarations,
                aiData.additional_declarations,
                aiData.additionalDeclarations,
                aiData.remarks
            )

    };


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    const inspectionId =
        firstValue(
            inspectionData.inspectionId,
            complianceData.inspectionId,
            localStorage.getItem(
                "currentInspectionId"
            )
        ) ||
        `EP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;


    setText(
        inspectionIdEl,
        inspectionId,
        "EP-2026-000000"
    );


    /* =====================================================
       DISPLAY PRODUCT
    ===================================================== */

    setText(
        productNameEl,
        productData.productName
    );

    setText(
        manufacturerEl,
        productData.manufacturer
    );

    setText(
        netQuantityEl,
        productData.netQuantity
    );

    setText(
        mrpEl,
        productData.mrp
    );

    setText(
        packingDateEl,
        productData.packingDate
    );

    setText(
        consumerCareEl,
        productData.consumerCare
    );

    setText(
        addressEl,
        productData.address
    );

    setText(
        additionalDeclarationsEl,
        productData.additionalDeclarations,
        "None"
    );


    /* =====================================================
       INSPECTION DATE
    ===================================================== */

    const dateSource =
        complianceData.assessedAt ||
        complianceData.finalizedAt ||
        inspectionData.savedAt ||
        complianceData.generatedAt ||
        new Date().toISOString();


    const inspectionDate =
        new Date(dateSource);


    let formattedDate =
        "Not available";


    if (
        !isNaN(
            inspectionDate.getTime()
        )
    ) {

        formattedDate =
            inspectionDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

    }


    setText(
        inspectionDateEl,
        formattedDate
    );


    setText(
        inspectionOfficerEl,
        complianceData.officerName ||
        savedOfficerName
    );


    /* =====================================================
       IMAGE EVIDENCE
    ===================================================== */

    function getEvidenceImage() {

        const candidates = [

            sessionStorage.getItem(
                "eParakhCapturedImage"
            ),

            localStorage.getItem(
                "scannedProductImage"
            ),

            localStorage.getItem(
                "productImage"
            ),

            inspectionData.image,

            inspectionData.imageData,

            inspectionData.productImage,

            inspectionData.evidenceImage,

            complianceData.image,

            complianceData.imageData,

            complianceData.evidenceImage,

            complianceData.productImage

        ];


        for (const image of candidates) {

            if (
                image &&
                String(image).trim() !== ""
            ) {

                return String(image).trim();

            }

        }


        return "";

    }


    function renderEvidenceImage() {

        const imageSource =
            getEvidenceImage();


        if (!imageSource) {

            console.warn(
                "No inspection evidence image found."
            );

            return;

        }


        /*
         * Existing evidence container?
         */

        let evidenceSection =
            document.getElementById(
                "evidenceSection"
            );


        /*
         * If HTML doesn't contain one,
         * create it automatically.
         */

        if (!evidenceSection) {

            evidenceSection =
                document.createElement(
                    "section"
                );

            evidenceSection.id =
                "evidenceSection";

            evidenceSection.className =
                "inspection-evidence";


            const heading =
                document.createElement(
                    "h2"
                );

            heading.textContent =
                "Inspection Evidence";


            const subtitle =
                document.createElement(
                    "p"
                );

            subtitle.textContent =
                "Product image captured during inspection";


            const imageWrapper =
                document.createElement(
                    "div"
                );

            imageWrapper.className =
                "evidence-image-wrapper";


            const image =
                document.createElement(
                    "img"
                );

            image.id =
                "evidenceImage";

            image.className =
                "evidence-image";

            image.alt =
                "Scanned product evidence";


            imageWrapper.appendChild(
                image
            );


            evidenceSection.appendChild(
                heading
            );

            evidenceSection.appendChild(
                subtitle
            );

            evidenceSection.appendChild(
                imageWrapper
            );


            /*
             * Insert before Verification section
             */

            const verificationHeading =
                document.querySelector(
                    "#checksList"
                );


            if (
                verificationHeading &&
                verificationHeading.parentElement
            ) {

                verificationHeading
                    .parentElement
                    .before(
                        evidenceSection
                    );

            } else {

                document.body.appendChild(
                    evidenceSection
                );

            }

        }


        const image =
            document.getElementById(
                "evidenceImage"
            );


        if (image) {

            image.src =
                imageSource;

            image.style.display =
                "block";

            image.onerror =
                () => {

                    console.error(
                        "Unable to display evidence image."
                    );

                    image.style.display =
                        "none";

                };

        }

    }


    renderEvidenceImage();


    /* =====================================================
       CHECKS
    ===================================================== */

    let checks = [];


    if (
        Array.isArray(
            complianceData.checks
        )
    ) {

        checks =
            complianceData.checks;

    }


    /*
     * Normalize every status.
     *
     * verified/pass = PASSED
     * everything else = FAILED
     */

    checks =
        checks.map(check => {

            const status =
                String(
                    check.status || ""
                ).toLowerCase();


            return {

                ...check,

                status:
                    (
                        status === "pass" ||
                        status === "passed" ||
                        status === "verified"
                    )
                        ? "pass"
                        : "fail"

            };

        });


    /* =====================================================
       FALLBACK CHECKS
    ===================================================== */

    if (!checks.length) {

        checks = [

            {
                name:
                    "Manufacturer / Packer / Importer",

                description:
                    "Name and identification details are clearly declared.",

                status:
                    "fail"

            },

            {
                name:
                    "Common / Generic Product Name",

                description:
                    "Product identity is clearly mentioned.",

                status:
                    "fail"

            },

            {
                name:
                    "Net Quantity",

                description:
                    "Quantity is expressed in the prescribed unit and format.",

                status:
                    "fail"

            },

            {
                name:
                    "Maximum Retail Price",

                description:
                    "MRP is declared with applicable taxes / wording.",

                status:
                    "fail"

            },

            {
                name:
                    "Date of Manufacture / Packing",

                description:
                    "Applicable date declaration is present and readable.",

                status:
                    "fail"

            },

            {
                name:
                    "Consumer Care Details",

                description:
                    "Consumer complaint contact information is available.",

                status:
                    "fail"

            },

            {
                name:
                    "Address Declaration",

                description:
                    "Relevant business / manufacturer address is declared.",

                status:
                    "fail"

            },

            {
                name:
                    "Additional Mandatory Declarations",

                description:
                    "Other applicable declarations have been verified.",

                status:
                    "fail"

            }

        ];

    }


    /* =====================================================
       SCORE
    ===================================================== */

    const totalChecks =
        checks.length;


    const passedChecks =
        checks.filter(
            check =>
                check.status === "pass"
        ).length;


    const failedChecks =
        totalChecks -
        passedChecks;


    /*
     * IMPORTANT:
     *
     * Score is calculated from ACTUAL checks.
     *
     * Never allow a stored 100% score
     * to override 5/8 etc.
     */

    const score =
        totalChecks > 0
            ? Math.round(
                (
                    passedChecks /
                    totalChecks
                ) * 100
            )
            : 0;


    setText(
        complianceScore,
        `${score}%`,
        "0%"
    );


    if (checkCount) {

        checkCount.textContent =
            `${passedChecks} / ${totalChecks} Passed`;

    }


    /* =====================================================
       FINAL STATUS
    ===================================================== */

    const isCompliant =
        totalChecks > 0 &&
        failedChecks === 0 &&
        score === 100;


    /* =====================================================
       FINAL RESULT UI
    ===================================================== */

    if (isCompliant) {

        if (resultIcon) {

            resultIcon.textContent =
                "✓";

            resultIcon.style.background =
                "#e9f8f1";

            resultIcon.style.color =
                "#16845b";

        }


        if (resultTitle) {

            resultTitle.textContent =
                "Product Compliant";

        }


        if (resultDescription) {

            resultDescription.textContent =
                "The declared product information has passed the applicable compliance checks.";

        }


        if (complianceScore) {

            complianceScore.style.color =
                "#16845b";

        }

    } else {

        if (resultIcon) {

            resultIcon.textContent =
                "!";

            resultIcon.style.background =
                "#fdecec";

            resultIcon.style.color =
                "#c53d3d";

        }


        if (resultTitle) {

            resultTitle.textContent =
                "Product Non-Compliant";

        }


        if (resultDescription) {

            resultDescription.textContent =
                `${failedChecks} compliance requirement${failedChecks === 1 ? "" : "s"} require attention before the product can be considered compliant.`;

        }


        if (complianceScore) {

            complianceScore.style.color =
                "#c53d3d";

        }

    }


    /* =====================================================
       RENDER CHECKS
    ===================================================== */

    if (checksList) {

        checksList.innerHTML = "";


        checks.forEach(check => {

            const passed =
                check.status === "pass";


            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "check-item";


            const icon =
                document.createElement(
                    "div"
                );

            icon.className =
                `check-icon ${
                    passed
                        ? "pass"
                        : "fail"
                }`;

            icon.textContent =
                passed
                    ? "✓"
                    : "!";


            const content =
                document.createElement(
                    "div"
                );

            content.className =
                "check-content";


            const title =
                document.createElement(
                    "strong"
                );

            title.textContent =
                check.name ||
                "Compliance Requirement";


            const description =
                document.createElement(
                    "span"
                );

            description.textContent =
                check.description ||
                "Verification completed.";


            content.appendChild(
                title
            );

            content.appendChild(
                description
            );


            const status =
                document.createElement(
                    "span"
                );

            status.className =
                `check-status ${
                    passed
                        ? "pass"
                        : "fail"
                }`;

            status.textContent =
                passed
                    ? "PASSED"
                    : "FAILED";


            item.appendChild(icon);
            item.appendChild(content);
            item.appendChild(status);


            checksList.appendChild(
                item
            );

        });

    }


    /* =====================================================
       VIOLATIONS
    ===================================================== */

    let violations =
        checks
            .filter(
                check =>
                    check.status === "fail"
            )
            .map(check => ({

                title:
                    check.name,

                description:
                    check.description ||
                    "Requirement not satisfied."

            }));


    /*
     * Officer observation
     */

    if (
        complianceData.observation &&
        String(
            complianceData.observation
        ).trim() !== ""
    ) {

        violations.push({

            title:
                "Officer Observation",

            description:
                complianceData.observation

        });

    }


    /* =====================================================
       RENDER VIOLATIONS
    ===================================================== */

    if (violationsList) {

        violationsList.innerHTML = "";


        if (!violations.length) {

            violationsList.innerHTML = `
                <div class="no-violations">
                    ✓ No violations detected during this assessment.
                </div>
            `;

        } else {

            violations.forEach(
                violation => {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "violation-item";


                    const icon =
                        document.createElement(
                            "div"
                        );

                    icon.className =
                        "violation-icon";

                    icon.textContent =
                        "!";


                    const content =
                        document.createElement(
                            "div"
                        );

                    content.className =
                        "violation-content";


                    const title =
                        document.createElement(
                            "strong"
                        );

                    title.textContent =
                        violation.title ||
                        "Compliance Violation";


                    const description =
                        document.createElement(
                            "p"
                        );

                    description.textContent =
                        violation.description ||
                        "Requirement not satisfied.";


                    content.appendChild(
                        title
                    );

                    content.appendChild(
                        description
                    );


                    item.appendChild(icon);
                    item.appendChild(content);


                    violationsList.appendChild(
                        item
                    );

                }
            );

        }

    }


    /* =====================================================
       SAVE FINAL RESULT
    ===================================================== */

    const finalResult = {

        ...complianceData,

        inspectionId,

        score,

        total:
            totalChecks,

        verified:
            passedChecks,

        status:
            isCompliant
                ? "compliant"
                : "non-compliant",

        checks,

        violations,

        product:
            productData,

        officerName:
            savedOfficerName,

        officerId:
            savedOfficerId,

        evidenceImage:
            getEvidenceImage(),

        finalizedAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "complianceResult",
        JSON.stringify(
            finalResult
        )
    );


    /* =====================================================
       REPORT / PRINT
    ===================================================== */

    if (reportBtn) {

        reportBtn.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =====================================================
       NEW INSPECTION
    ===================================================== */

    if (newInspectionBtn) {

        newInspectionBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Start a new product inspection?"
                    );


                if (!confirmed)
                    return;


                localStorage.removeItem(
                    "currentInspection"
                );

                localStorage.removeItem(
                    "complianceAssessment"
                );

                localStorage.removeItem(
                    "complianceResult"
                );

                localStorage.removeItem(
                    "inspectionDraft"
                );

                localStorage.removeItem(
                    "scannedProductImage"
                );

                localStorage.removeItem(
                    "productImage"
                );

                sessionStorage.removeItem(
                    "eParakhCapturedImage"
                );


                window.location.href =
                    "inspection.html";

            }
        );

    }


    /* =====================================================
       DASHBOARD
    ===================================================== */

    if (dashboardBtn) {

        dashboardBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../index.html";

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


                if (!confirmed)
                    return;


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
                    "inspectionDraft"
                );

                localStorage.removeItem(
                    "complianceAssessment"
                );

                localStorage.removeItem(
                    "complianceResult"
                );

                localStorage.removeItem(
                    "scannedProductImage"
                );

                localStorage.removeItem(
                    "productImage"
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
       PRINT
    ===================================================== */

    window.addEventListener(
        "beforeprint",
        () => {

            document.title =
                `e-PARAKH Inspection Report - ${inspectionId}`;

        }
    );


    console.log(
        "e-PARAKH Result loaded:",
        {
            inspectionId,
            score,
            passedChecks,
            failedChecks,
            status:
                isCompliant
                    ? "COMPLIANT"
                    : "NON-COMPLIANT",
            evidence:
                !!getEvidenceImage()
        }
    );

});