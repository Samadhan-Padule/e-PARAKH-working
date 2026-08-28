/* =========================================================
   e-PARAKH — COMPLIANCE VERIFICATION JS
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

    const logoutBtn =
        document.getElementById("logoutBtn");

    const backBtn =
        document.getElementById("backBtn");

    const generateBtn =
        document.getElementById("generateBtn");

    const observation =
        document.getElementById("observation");

    const checkboxes =
        document.querySelectorAll(".rule-checkbox");

    const verificationCount =
        document.getElementById("verificationCount");

    const complianceScore =
        document.getElementById("complianceScore");

    const scoreBadge =
        document.getElementById("scoreBadge");

    const scoreMessage =
        document.getElementById("scoreMessage");

    const scoreCircle =
        document.getElementById("scoreCircle");

    const decisionText =
        document.getElementById("decisionText");


    /* =====================================================
       LOAD OFFICER DATA
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName");

    const savedOfficerId =
        localStorage.getItem("officerId");

    if (savedOfficerName && officerName) {

        officerName.textContent =
            savedOfficerName;

        if (officerAvatar) {

            const initials =
                savedOfficerName
                    .split(" ")
                    .map(word => word.charAt(0))
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

            officerAvatar.textContent =
                initials || "AO";
        }

    }

    if (savedOfficerId && officerId) {

        officerId.textContent =
            savedOfficerId;

    }


    /* =====================================================
       LOAD CURRENT INSPECTION
    ===================================================== */

    let inspectionData = null;

    const savedInspection =
        localStorage.getItem("currentInspection");

    if (savedInspection) {

        try {

            inspectionData =
                JSON.parse(savedInspection);

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

    if (
        inspectionData &&
        inspectionData.inspectionId &&
        inspectionIdElement
    ) {

        inspectionIdElement.textContent =
            inspectionData.inspectionId;

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
       SUMMARY ELEMENTS
    ===================================================== */

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


    /* =====================================================
       LOAD SUMMARY
    ===================================================== */

    if (inspectionData) {

        setText(
            summaryManufacturer,
            inspectionData.manufacturer
        );

        setText(
            summaryProductName,
            inspectionData.productName
        );

        setText(
            summaryQuantity,
            inspectionData.netQuantity
        );

        setText(
            summaryMrp,
            inspectionData.mrp
        );

        setText(
            summaryPackingDate,
            inspectionData.packingDate
        );

        setText(
            summaryConsumerCare,
            inspectionData.consumerCare
        );

    }


    function setText(element, value) {

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
                "Not available";

        }

    }


    /* =====================================================
       CHECKLIST
    ===================================================== */

    function updateComplianceScore() {

        const total =
            checkboxes.length;

        let verified = 0;

        checkboxes.forEach(checkbox => {

            if (checkbox.checked) {

                verified++;

            }

        });


        /* -----------------------------------------------
           COUNT
        ------------------------------------------------ */

        if (verificationCount) {

            verificationCount.textContent =
                `${verified} / ${total} VERIFIED`;

        }


        /* -----------------------------------------------
           SCORE
        ------------------------------------------------ */

        const score =
            total === 0
                ? 0
                : Math.round(
                    (verified / total) * 100
                );


        if (complianceScore) {

            complianceScore.textContent =
                `${score}%`;

        }


        /* -----------------------------------------------
           CIRCLE
        ------------------------------------------------ */

        if (scoreCircle) {

            const degrees =
                (score / 100) * 360;

            scoreCircle.style.background =
                `conic-gradient(
                    #176ba7 ${degrees}deg,
                    #e7edf3 ${degrees}deg
                )`;

        }


        /* -----------------------------------------------
           STATUS
        ------------------------------------------------ */

        if (scoreBadge) {

            if (score === 100) {

                scoreBadge.textContent =
                    "COMPLIANT";

                scoreBadge.style.background =
                    "#edf8f3";

                scoreBadge.style.color =
                    "#17845c";

            } else if (score >= 75) {

                scoreBadge.textContent =
                    "REVIEW";

                scoreBadge.style.background =
                    "#eef7fd";

                scoreBadge.style.color =
                    "#1769aa";

            } else if (score > 0) {

                scoreBadge.textContent =
                    "PARTIAL";

                scoreBadge.style.background =
                    "#fff5dc";

                scoreBadge.style.color =
                    "#9b7014";

            } else {

                scoreBadge.textContent =
                    "PENDING";

                scoreBadge.style.background =
                    "#fff5dc";

                scoreBadge.style.color =
                    "#9b7014";

            }

        }


        /* -----------------------------------------------
           MESSAGE
        ------------------------------------------------ */

        if (scoreMessage) {

            if (score === 100) {

                scoreMessage.textContent =
                    "All mandatory declarations have been verified. The inspection is ready for final result generation.";

            } else if (score > 0) {

                scoreMessage.textContent =
                    `${verified} of ${total} compliance requirements have been verified. Complete the remaining checks before proceeding.`;

            } else {

                scoreMessage.textContent =
                    "Complete the verification checklist to calculate the compliance score.";

            }

        }


        /* -----------------------------------------------
           DECISION
        ------------------------------------------------ */

        if (decisionText) {

            if (score === 100) {

                decisionText.textContent =
                    "All checklist items are verified. You may generate the final inspection result.";

            } else {

                decisionText.textContent =
                    "Verify all checklist items before proceeding to the final inspection result.";

            }

        }


        /* -----------------------------------------------
           GENERATE BUTTON
        ------------------------------------------------ */

        if (generateBtn) {

            generateBtn.disabled =
                score !== 100;

        }

    }


    /* =====================================================
       CHECKBOX EVENTS
    ===================================================== */

    checkboxes.forEach(checkbox => {

        checkbox.addEventListener(
            "change",
            updateComplianceScore
        );

    });


    /* =====================================================
       LOAD SAVED COMPLIANCE DATA
    ===================================================== */

    const savedCompliance =
        localStorage.getItem("complianceAssessment");

    if (savedCompliance) {

        try {

            const complianceData =
                JSON.parse(savedCompliance);

            if (
                complianceData.checklist &&
                typeof complianceData.checklist === "object"
            ) {

                checkboxes.forEach(checkbox => {

                    const rule =
                        checkbox.dataset.rule;

                    if (
                        complianceData.checklist[rule] === true
                    ) {

                        checkbox.checked = true;

                    }

                });

            }

            if (
                observation &&
                complianceData.observation
            ) {

                observation.value =
                    complianceData.observation;

            }

        } catch (error) {

            console.error(
                "Unable to load compliance assessment:",
                error
            );

        }

    }


    /* =====================================================
       INITIAL SCORE
    ===================================================== */

    updateComplianceScore();


    /* =====================================================
       SAVE COMPLIANCE DATA
    ===================================================== */

    function getComplianceData() {

        const checklist = {};

        checkboxes.forEach(checkbox => {

            const rule =
                checkbox.dataset.rule;

            checklist[rule] =
                checkbox.checked;

        });


        const total =
            checkboxes.length;

        const verified =
            Array.from(checkboxes)
                .filter(checkbox => checkbox.checked)
                .length;

        const score =
            total === 0
                ? 0
                : Math.round(
                    (verified / total) * 100
                );


        return {

            inspectionId:
                inspectionIdElement?.textContent || "",

            checklist:
                checklist,

            verified:
                verified,

            total:
                total,

            score:
                score,

            observation:
                observation?.value || "",

            officerName:
                savedOfficerName || "",

            officerId:
                savedOfficerId || "",

            assessedAt:
                new Date().toISOString()

        };

    }


    /* =====================================================
       AUTO SAVE
    ===================================================== */

    function saveComplianceData() {

        const data =
            getComplianceData();

        localStorage.setItem(
            "complianceAssessment",
            JSON.stringify(data)
        );

    }


    checkboxes.forEach(checkbox => {

        checkbox.addEventListener(
            "change",
            saveComplianceData
        );

    });


    if (observation) {

        observation.addEventListener(
            "input",
            saveComplianceData
        );

    }


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            () => {

                saveComplianceData();

                window.location.href =
                    "inspection.html";

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

                const data =
                    getComplianceData();

                if (data.score !== 100) {

                    alert(
                        "Please verify all compliance requirements before generating the final result."
                    );

                    return;

                }


                /* -----------------------------------------
                   SAVE FINAL ASSESSMENT
                ------------------------------------------ */

                localStorage.setItem(
                    "complianceResult",
                    JSON.stringify(data)
                );


                /* -----------------------------------------
                   GO TO RESULT PAGE
                ------------------------------------------ */

                window.location.href =
                    "result.html";

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
                    "inspectionDraft"
                );

                localStorage.removeItem(
                    "complianceAssessment"
                );

                localStorage.removeItem(
                    "scannedProductImage"
                );


                window.location.href =
                    "login.html";

            }
        );

    }

});