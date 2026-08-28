/* =========================================================
   e-PARAKH — COMPLIANCE VERIFICATION JS
   Final Compliance Assessment Controller
========================================================= */

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
       LOAD OFFICER DATA
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
       LOAD PRODUCT INFORMATION
    ===================================================== */

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


    /* =====================================================
       DATA STATUS
    ===================================================== */

    const hasInspectionData =
        Object.keys(inspectionData).length > 0;


    if (summaryStatus) {

        if (hasInspectionData) {

            summaryStatus.textContent =
                "DATA LOADED";

        } else {

            summaryStatus.textContent =
                "NO DATA";

        }

    }


    /* =====================================================
       CHECKBOXES
    ===================================================== */

    const ruleCheckboxes =
        document.querySelectorAll(
            ".rule-checkbox"
        );


    /*
       Store verification state.

       false = not verified
       true  = verified
    */

    const verificationState = {};


    ruleCheckboxes.forEach(
        checkbox => {

            const rule =
                checkbox.dataset.rule;

            verificationState[rule] =
                false;


            checkbox.addEventListener(
                "change",
                () => {

                    verificationState[rule] =
                        checkbox.checked;

                    updateRuleVisualState(
                        checkbox
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
        checkbox
    ) {

        const ruleItem =
            checkbox.closest(".rule-item");

        if (!ruleItem) return;


        const status =
            ruleItem.querySelector(
                ".rule-status"
            );


        if (checkbox.checked) {

            ruleItem.classList.add(
                "verified"
            );


            if (status) {

                status.textContent =
                    "Verified";

            }

        } else {

            ruleItem.classList.remove(
                "verified"
            );


            if (status) {

                status.textContent =
                    "Pending";

            }

        }

    }


    /* =====================================================
       INITIAL CALCULATION
    ===================================================== */

    calculateCompliance();


    /* =====================================================
       CALCULATE COMPLIANCE
    ===================================================== */

    function calculateCompliance() {

        const total =
            ruleCheckboxes.length;

        const verified =
            Array.from(ruleCheckboxes)
                .filter(
                    checkbox =>
                        checkbox.checked
                )
                .length;


        let score = 0;


        if (total > 0) {

            score =
                Math.round(
                    (verified / total) * 100
                );

        }


        /* -----------------------------------------------
           COUNT
        ----------------------------------------------- */

        if (verificationCount) {

            verificationCount.textContent =
                `${verified} / ${total} VERIFIED`;

        }


        /* -----------------------------------------------
           SCORE
        ----------------------------------------------- */

        if (complianceScore) {

            complianceScore.textContent =
                `${score}%`;

        }


        /* -----------------------------------------------
           SCORE CIRCLE
        ----------------------------------------------- */

        if (scoreCircle) {

            scoreCircle.style.setProperty(
                "--score",
                `${score}%`
            );

        }


        /* -----------------------------------------------
           STATUS
        ----------------------------------------------- */

        if (verified === 0) {

            setPendingState();

        } else if (verified < total) {

            setPartialState(
                score,
                verified,
                total
            );

        } else {

            setCompleteState();

        }


        /* -----------------------------------------------
           SAVE CURRENT STATE
        ----------------------------------------------- */

        saveComplianceDraft(
            score,
            verified,
            total
        );

    }


    /* =====================================================
       PENDING STATE
    ===================================================== */

    function setPendingState() {

        if (scoreBadge) {

            scoreBadge.textContent =
                "PENDING";

            scoreBadge.className =
                "score-badge pending";

        }


        if (scoreMessage) {

            scoreMessage.textContent =
                "Complete the verification checklist to calculate the compliance score.";

        }


        if (decisionText) {

            decisionText.textContent =
                "Verify all checklist items before proceeding to the final inspection result.";

        }

    }


    /* =====================================================
       PARTIAL STATE
    ===================================================== */

    function setPartialState(
        score,
        verified,
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
                `${verified} of ${total} declarations have been verified.`;

        }


        if (decisionText) {

            decisionText.textContent =
                "Some declarations are still pending verification.";

        }

    }


    /* =====================================================
       COMPLETE STATE
    ===================================================== */

    function setCompleteState() {

        if (scoreBadge) {

            scoreBadge.textContent =
                "VERIFIED";

            scoreBadge.className =
                "score-badge compliant";

        }


        if (scoreMessage) {

            scoreMessage.textContent =
                "All mandatory declaration checks have been verified by the officer.";

        }


        if (decisionText) {

            decisionText.textContent =
                "All mandatory checklist items have been verified. The inspection result can now be generated.";

        }

    }


    /* =====================================================
       SAVE COMPLIANCE DRAFT
    ===================================================== */

    function saveComplianceDraft(
        score,
        verified,
        total
    ) {

        const checks =
            Array.from(ruleCheckboxes)
                .map(checkbox => {

                    const rule =
                        checkbox.dataset.rule;

                    const ruleItem =
                        checkbox.closest(
                            ".rule-item"
                        );

                    const title =
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


                    return {

                        rule,

                        name: title,

                        description,

                        status:
                            checkbox.checked
                                ? "pass"
                                : "fail"

                    };

                });


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
                            "Requirement has not been verified."

                    })
                );


        const status =
            verified === total &&
            total > 0
                ? "compliant"
                : "non-compliant";


        const complianceResult = {

            inspectionId,

            score,

            verified,

            total,

            status,

            checks,

            violations,

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

                const total =
                    ruleCheckboxes.length;

                const verified =
                    Array.from(
                        ruleCheckboxes
                    )
                    .filter(
                        checkbox =>
                            checkbox.checked
                    )
                    .length;


                /*
                   Require all checklist items.
                */

                if (
                    total === 0 ||
                    verified !== total
                ) {

                    alert(
                        "Please verify all mandatory compliance checklist items before generating the result."
                    );

                    return;

                }


                /*
                   Get final score
                */

                const score =
                    Math.round(
                        (verified / total) * 100
                    );


                /*
                   Collect checks
                */

                const checks =
                    Array.from(
                        ruleCheckboxes
                    )
                    .map(checkbox => {

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


                        return {

                            rule,

                            name,

                            description,

                            status:
                                checkbox.checked
                                    ? "pass"
                                    : "fail"

                        };

                    });


                /*
                   Save final result
                */

                const finalResult = {

                    inspectionId,

                    status:
                        score === 100
                            ? "compliant"
                            : "non-compliant",

                    score,

                    checks,

                    violations:
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
                                        check.description

                                })
                            ),

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
                   Go to final result page
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

});