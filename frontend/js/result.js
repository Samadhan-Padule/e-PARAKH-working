/* =========================================================
   e-PARAKH — FINAL INSPECTION RESULT JS
   STEP 04 — FINAL RESULT & REPORT
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

    const violationsSection =
        document.getElementById(
            "violationsSection"
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
                value;

        } else {

            element.textContent =
                fallback;
        }
    }


    /* =====================================================
       OFFICER DATA
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
                .split(/\s+/)
                .filter(Boolean)
                .map(
                    word =>
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

    let inspectionData = {};

    const storedInspection =
        localStorage.getItem(
            "currentInspection"
        );

    if (storedInspection) {

        try {

            inspectionData =
                JSON.parse(
                    storedInspection
                );

        } catch (error) {

            console.error(
                "Unable to load inspection:",
                error
            );
        }
    }


    /* =====================================================
       LOAD COMPLIANCE RESULT
    ===================================================== */

    let complianceData = {};

    const storedCompliance =
        localStorage.getItem(
            "complianceResult"
        );

    if (storedCompliance) {

        try {

            complianceData =
                JSON.parse(
                    storedCompliance
                );

        } catch (error) {

            console.error(
                "Unable to load compliance result:",
                error
            );
        }
    }


    /* =====================================================
       FALLBACK — COMPLIANCE ASSESSMENT
    ===================================================== */

    if (
        !complianceData ||
        Object.keys(complianceData).length === 0
    ) {

        const savedAssessment =
            localStorage.getItem(
                "complianceAssessment"
            );

        if (savedAssessment) {

            try {

                complianceData =
                    JSON.parse(
                        savedAssessment
                    );

            } catch (error) {

                console.error(
                    "Unable to load assessment:",
                    error
                );
            }
        }
    }


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    let inspectionId =
        inspectionData.inspectionId ||
        complianceData.inspectionId;


    if (!inspectionId) {

        inspectionId =
            "EP-" +
            new Date().getFullYear() +
            "-" +
            String(Date.now()).slice(-6);
    }


    setText(
        inspectionIdEl,
        inspectionId,
        "EP-2026-000000"
    );


    /* =====================================================
       PRODUCT DATA
    ===================================================== */

    setText(
        productNameEl,
        inspectionData.productName
    );

    setText(
        manufacturerEl,
        inspectionData.manufacturer
    );

    setText(
        netQuantityEl,
        inspectionData.netQuantity
    );

    setText(
        mrpEl,
        inspectionData.mrp
    );

    setText(
        packingDateEl,
        inspectionData.packingDate
    );

    setText(
        consumerCareEl,
        inspectionData.consumerCare
    );

    setText(
        addressEl,
        inspectionData.address
    );

    setText(
        additionalDeclarationsEl,
        inspectionData.additionalDeclarations,
        "None"
    );


    /* =====================================================
       INSPECTION DATE
    ===================================================== */

    const dateSource =
        complianceData.assessedAt ||
        inspectionData.savedAt ||
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
       CHECK DATA
    ===================================================== */

    let checks = [];


    if (
        Array.isArray(
            complianceData.checks
        )
    ) {

        checks =
            complianceData.checks;

    } else if (
        complianceData.checklist
    ) {

        const ruleNames = {

            manufacturer:
                "Manufacturer / Packer / Importer",

            productName:
                "Common / Generic Product Name",

            quantity:
                "Net Quantity",

            mrp:
                "Maximum Retail Price",

            date:
                "Date of Manufacture / Packing",

            consumerCare:
                "Consumer Care Details",

            address:
                "Address Declaration",

            additional:
                "Additional Mandatory Declarations"
        };


        checks =
            Object.keys(
                complianceData.checklist
            ).map(rule => {

                const passed =
                    complianceData
                        .checklist[rule] === true;

                return {

                    rule,

                    name:
                        ruleNames[rule] ||
                        "Compliance Requirement",

                    status:
                        passed
                            ? "pass"
                            : "fail",

                    description:
                        passed
                            ? "Requirement verified by the inspecting officer."
                            : "Requirement requires attention or was not verified."
                };

            });
    }


    /* =====================================================
       SAFETY FALLBACK
    ===================================================== */

    if (!checks.length) {

        checks = [

            {
                name:
                    "Manufacturer / Packer / Importer",
                description:
                    "Manufacturer or packer details are declared.",
                status: "fail"
            },

            {
                name:
                    "Common / Generic Product Name",
                description:
                    "Product identity is clearly declared.",
                status: "fail"
            },

            {
                name:
                    "Net Quantity",
                description:
                    "Net quantity is declared.",
                status: "fail"
            },

            {
                name:
                    "Maximum Retail Price",
                description:
                    "MRP declaration is present.",
                status: "fail"
            },

            {
                name:
                    "Date of Manufacture / Packing",
                description:
                    "Applicable date declaration is present.",
                status: "fail"
            },

            {
                name:
                    "Consumer Care Details",
                description:
                    "Consumer care information is declared.",
                status: "fail"
            },

            {
                name:
                    "Address Declaration",
                description:
                    "Relevant address is declared.",
                status: "fail"
            },

            {
                name:
                    "Additional Mandatory Declarations",
                description:
                    "Other applicable declarations are verified.",
                status: "fail"
            }

        ];
    }


    /* =====================================================
       NORMALIZE CHECK STATUS
    ===================================================== */

    checks =
        checks.map(check => {

            return {

                ...check,

                status:
                    check.status === "pass"
                        ? "pass"
                        : "fail"
            };
        });


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


    let score =
        totalChecks > 0
            ? Math.round(
                (passedChecks /
                    totalChecks) *
                100
            )
            : 0;


    if (
        typeof complianceData.score ===
        "number"
    ) {

        score =
            Math.max(
                0,
                Math.min(
                    100,
                    complianceData.score
                )
            );
    }


    /* =====================================================
       STATUS
    ===================================================== */

    const isCompliant =
        complianceData.status ===
        "compliant"
            ? true
            : complianceData.status ===
              "non-compliant"
                ? false
                : failedChecks === 0;


    /* =====================================================
       DISPLAY SCORE
    ===================================================== */

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

    renderChecks(checks);


    function renderChecks(checkItems) {

        if (!checksList) return;

        checksList.innerHTML = "";


        checkItems.forEach(check => {

            const passed =
                check.status === "pass";

            const item =
                document.createElement("div");

            item.className =
                "check-item";


            const icon =
                document.createElement("div");

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
                document.createElement("div");

            content.className =
                "check-content";


            const title =
                document.createElement("strong");

            title.textContent =
                check.name ||
                "Compliance Requirement";


            const description =
                document.createElement("span");

            description.textContent =
                check.description ||
                "Verification completed.";


            content.appendChild(title);
            content.appendChild(description);


            const status =
                document.createElement("span");

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

            checksList.appendChild(item);
        });
    }


    /* =====================================================
       VIOLATIONS
    ===================================================== */

    let violations = [];


    if (
        Array.isArray(
            complianceData.violations
        )
    ) {

        violations =
            complianceData.violations;

    } else {

        violations =
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
    }


    /* =====================================================
       ADD OFFICER OBSERVATION
    ===================================================== */

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


    renderViolations(
        violations
    );


    function renderViolations(
        items
    ) {

        if (!violationsList) return;

        violationsList.innerHTML = "";


        if (!items.length) {

            violationsList.innerHTML = `
                <div class="no-violations">
                    ✓ No violations detected during this assessment.
                </div>
            `;

            return;
        }


        items.forEach(
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


                content.appendChild(title);
                content.appendChild(description);


                item.appendChild(icon);
                item.appendChild(content);

                violationsList.appendChild(
                    item
                );
            }
        );
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
            inspectionData,

        officerName:
            savedOfficerName,

        officerId:
            savedOfficerId,

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
       GENERATE REPORT
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

                sessionStorage.removeItem(
                    "eParakhCapturedImage"
                );


                window.location.href =
                    "login.html";
            }
        );
    }


    /* =====================================================
       PRINT SUPPORT
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
            status:
                isCompliant
                    ? "COMPLIANT"
                    : "NON-COMPLIANT"
        }
    );

});