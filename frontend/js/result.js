/* =========================================================
   e-PARAKH — FINAL INSPECTION RESULT JS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const officerName =
        document.getElementById("officerName");

    const officerId =
        document.getElementById("officerId");

    const officerAvatar =
        document.getElementById("officerAvatar");

    const inspectionIdElement =
        document.getElementById("inspectionId");

    const resultIcon =
        document.getElementById("resultIcon");

    const resultTitle =
        document.getElementById("resultTitle");

    const resultDescription =
        document.getElementById("resultDescription");

    const complianceScore =
        document.getElementById("complianceScore");

    const productName =
        document.getElementById("productName");

    const manufacturer =
        document.getElementById("manufacturer");

    const netQuantity =
        document.getElementById("netQuantity");

    const mrp =
        document.getElementById("mrp");

    const packingDate =
        document.getElementById("packingDate");

    const consumerCare =
        document.getElementById("consumerCare");

    const address =
        document.getElementById("address");

    const additionalDeclarations =
        document.getElementById(
            "additionalDeclarations"
        );

    const inspectionDate =
        document.getElementById("inspectionDate");

    const inspectionOfficer =
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
       OFFICER DATA
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName");

    const savedOfficerId =
        localStorage.getItem("officerId");

    if (savedOfficerName && officerName) {
        officerName.textContent =
            savedOfficerName;
    }

    if (savedOfficerId && officerId) {
        officerId.textContent =
            savedOfficerId;
    }

    if (savedOfficerName && officerAvatar) {

        const initials =
            savedOfficerName
                .split(" ")
                .map(name => name.charAt(0))
                .join("")
                .substring(0, 2)
                .toUpperCase();

        officerAvatar.textContent =
            initials || "IN";
    }


    /* =====================================================
       LOAD INSPECTION DATA
    ===================================================== */

    let inspectionData = {};

    const currentInspection =
        localStorage.getItem(
            "currentInspection"
        );

    if (currentInspection) {

        try {

            inspectionData =
                JSON.parse(currentInspection);

        } catch (error) {

            console.error(
                "Unable to load inspection data:",
                error
            );

        }

    }


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    const storedInspectionId =
        inspectionData.inspectionId;

    if (
        storedInspectionId &&
        inspectionIdElement
    ) {

        inspectionIdElement.textContent =
            storedInspectionId;

    } else if (inspectionIdElement) {

        const generatedId =
            "EP-" +
            new Date().getFullYear() +
            "-" +
            String(Date.now()).slice(-6);

        inspectionIdElement.textContent =
            generatedId;

    }


    /* =====================================================
       BASIC PRODUCT DATA
    ===================================================== */

    setText(
        productName,
        inspectionData.productName,
        "Not provided"
    );

    setText(
        manufacturer,
        inspectionData.manufacturer,
        "Not provided"
    );

    setText(
        netQuantity,
        inspectionData.netQuantity,
        "Not provided"
    );

    setText(
        mrp,
        inspectionData.mrp,
        "Not provided"
    );

    setText(
        packingDate,
        inspectionData.packingDate,
        "Not provided"
    );

    setText(
        consumerCare,
        inspectionData.consumerCare,
        "Not provided"
    );

    setText(
        address,
        inspectionData.address,
        "Not provided"
    );

    setText(
        additionalDeclarations,
        inspectionData.additionalDeclarations,
        "None"
    );


    /* =====================================================
       INSPECTION DATE
    ===================================================== */

    const savedAt =
        inspectionData.savedAt;

    let formattedDate =
        new Date().toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    if (savedAt) {

        const date =
            new Date(savedAt);

        if (!isNaN(date.getTime())) {

            formattedDate =
                date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );
        }
    }

    setText(
        inspectionDate,
        formattedDate
    );

    setText(
        inspectionOfficer,
        savedOfficerName || "Inspector"
    );


    /* =====================================================
       COMPLIANCE DATA
       
       compliance.js can save:
       localStorage.setItem(
           "complianceResult",
           JSON.stringify(...)
       );
    ===================================================== */

    let complianceData = {};

    const savedCompliance =
        localStorage.getItem(
            "complianceResult"
        );

    if (savedCompliance) {

        try {

            complianceData =
                JSON.parse(savedCompliance);

        } catch (error) {

            console.error(
                "Unable to load compliance result:",
                error
            );

        }

    }


    /* =====================================================
       DEFAULT CHECKS
    ===================================================== */

    const defaultChecks = [

        {
            name: "Manufacturer / Packer Declaration",
            description:
                "Manufacturer or packer details are declared.",
            status: "pass"
        },

        {
            name: "Product Name Declaration",
            description:
                "Name or generic description of the commodity is available.",
            status: "pass"
        },

        {
            name: "Net Quantity Declaration",
            description:
                "Net quantity is declared in the prescribed manner.",
            status: "pass"
        },

        {
            name: "Maximum Retail Price",
            description:
                "MRP declaration is present.",
            status: "pass"
        },

        {
            name: "Date of Packing",
            description:
                "Packing / manufacturing date declaration is available.",
            status: "pass"
        },

        {
            name: "Consumer Care Details",
            description:
                "Consumer care contact information is declared.",
            status: "pass"
        }

    ];


    const checks =
        Array.isArray(complianceData.checks)
            ? complianceData.checks
            : defaultChecks;


    /* =====================================================
       RENDER CHECKS
    ===================================================== */

    renderChecks(checks);


    /* =====================================================
       CALCULATE RESULT
    ===================================================== */

    const totalChecks =
        checks.length;

    const passedChecks =
        checks.filter(
            check =>
                check.status === "pass"
        ).length;

    const failedChecks =
        totalChecks - passedChecks;

    let score = 0;

    if (totalChecks > 0) {

        score =
            Math.round(
                (passedChecks / totalChecks) * 100
            );

    }


    /*
       If compliance.js already calculated score,
       use its value.
    */

    if (
        typeof complianceData.score ===
        "number"
    ) {

        score =
            complianceData.score;

    }


    if (complianceScore) {

        complianceScore.textContent =
            score + "%";

    }


    if (checkCount) {

        checkCount.textContent =
            passedChecks +
            " / " +
            totalChecks +
            " Passed";

    }


    /* =====================================================
       FINAL STATUS
    ===================================================== */

    const isCompliant =
        complianceData.status === "non-compliant"
            ? false
            : failedChecks === 0;


    if (isCompliant) {

        if (resultIcon) {

            resultIcon.textContent = "✓";

        }

        if (resultTitle) {

            resultTitle.textContent =
                "Product Compliant";

        }

        if (resultDescription) {

            resultDescription.textContent =
                "The declared product information has passed the applicable compliance checks.";

        }

        if (resultIcon) {

            resultIcon.style.background =
                "#e9f8f1";

            resultIcon.style.color =
                "#16845b";

        }

    } else {

        if (resultIcon) {

            resultIcon.textContent = "!";

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
                "One or more compliance requirements require attention.";

        }

        if (complianceScore) {

            complianceScore.style.color =
                "#c53d3d";

        }

    }


    /* =====================================================
       VIOLATIONS
    ===================================================== */

    const violations =
        Array.isArray(
            complianceData.violations
        )
            ? complianceData.violations
            : checks
                .filter(
                    check =>
                        check.status === "fail"
                )
                .map(
                    check => ({
                        title: check.name,
                        description:
                            check.description ||
                            "Compliance requirement not satisfied."
                    })
                );


    renderViolations(violations);


    /* =====================================================
       REPORT
    ===================================================== */

    if (reportBtn) {

        reportBtn.addEventListener(
            "click",
            () => {

                generateReport();

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

                if (!confirmed) return;

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
                    "scannedProductImage"
                );

                window.location.href =
                    "../scan.html";

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

                /*
                   Dashboard page can be connected later.
                */

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

                window.location.href =
                    "login.html";

            }
        );

    }


    /* =====================================================
       HELPER — SET TEXT
    ===================================================== */

    function setText(
        element,
        value,
        fallback = "—"
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
       RENDER CHECKS
    ===================================================== */

    function renderChecks(checks) {

        if (!checksList) return;

        checksList.innerHTML = "";

        if (!checks.length) {

            checksList.innerHTML = `
                <div class="no-violations">
                    No compliance checks available.
                </div>
            `;

            return;
        }


        checks.forEach(check => {

            const passed =
                check.status === "pass";

            const item =
                document.createElement("div");

            item.className =
                "check-item";

            item.innerHTML = `

                <div class="check-icon ${passed ? "pass" : "fail"}">
                    ${passed ? "✓" : "!"}
                </div>

                <div class="check-content">

                    <strong>
                        ${escapeHtml(
                            check.name ||
                            "Compliance Check"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            check.description ||
                            "Verification completed."
                        )}
                    </span>

                </div>

                <span class="check-status ${passed ? "pass" : "fail"}">
                    ${passed ? "PASSED" : "FAILED"}
                </span>

            `;

            checksList.appendChild(item);

        });

    }


    /* =====================================================
       RENDER VIOLATIONS
    ===================================================== */

    function renderViolations(
        violations
    ) {

        if (!violationsList) return;

        violationsList.innerHTML = "";


        if (!violations.length) {

            violationsList.innerHTML = `
                <div class="no-violations">
                    ✓ No violations detected during this assessment.
                </div>
            `;

            return;
        }


        violations.forEach(
            violation => {

                const item =
                    document.createElement("div");

                item.className =
                    "violation-item";

                item.innerHTML = `

                    <div class="violation-icon">
                        !
                    </div>

                    <div class="violation-content">

                        <strong>
                            ${escapeHtml(
                                violation.title ||
                                "Compliance Violation"
                            )}
                        </strong>

                        <p>
                            ${escapeHtml(
                                violation.description ||
                                "Requirement not satisfied."
                            )}
                        </p>

                    </div>

                `;

                violationsList.appendChild(
                    item
                );

            }
        );

    }


    /* =====================================================
       GENERATE REPORT
    ===================================================== */

    function generateReport() {

        /*
           Current frontend version:
           Browser print dialog can save
           the final result as PDF.

           Later this button will call:
           POST /api/reports
        */

        window.print();

    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});