/* =========================================================
   e-PARAKH — PRODUCT INSPECTION JS
   AI OCR + Inspection Workflow Controller
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const productImage =
        document.getElementById("productImage");

    const imagePlaceholder =
        document.getElementById("imagePlaceholder");

    const retakeBtn =
        document.getElementById("retakeBtn");

    const zoomBtn =
        document.getElementById("zoomBtn");

    const imageModal =
        document.getElementById("imageModal");

    const modalImage =
        document.getElementById("modalImage");

    const closeModal =
        document.getElementById("closeModal");

    const inspectionForm =
        document.getElementById("inspectionForm");

    const saveDraftBtn =
        document.getElementById("saveDraftBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const officerName =
        document.getElementById("officerName");

    const officerId =
        document.getElementById("officerId");

    const officerInitials =
        document.getElementById("officerInitials");

    const inspectionIdElement =
        document.getElementById("inspectionId");


    /* =====================================================
       AI SERVICE
    ===================================================== */

    const AI_SERVICE_URL =
        "http://localhost:8000/analyze";


    /* =====================================================
       OFFICER DATA
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName");

    const savedOfficerId =
        localStorage.getItem("officerId");


    if (savedOfficerName && officerName) {
        officerName.textContent = savedOfficerName;
    }


    if (savedOfficerId && officerId) {
        officerId.textContent = savedOfficerId;
    }


    /* =====================================================
       OFFICER INITIALS
    ===================================================== */

    if (savedOfficerName && officerInitials) {

        const words =
            savedOfficerName
                .trim()
                .split(/\s+/);

        let initials = "";

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

        officerInitials.textContent = initials;
    }


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    const inspectionId =
        generateInspectionId();


    if (inspectionIdElement) {
        inspectionIdElement.textContent = inspectionId;
    }


    function generateInspectionId() {

        const year =
            new Date().getFullYear();

        const randomNumber =
            String(Date.now()).slice(-6);

        return `EP-${year}-${randomNumber}`;
    }


    /* =====================================================
       LOAD SCANNED IMAGE
    ===================================================== */

    const savedImage =
        localStorage.getItem("scannedProductImage");


    if (savedImage) {

        showProductImage(savedImage);

        /*
         * Automatically start AI analysis
         */
        analyzeProductWithAI(savedImage);

    } else {

        showPlaceholder();
    }


    /* =====================================================
       SHOW PRODUCT IMAGE
    ===================================================== */

    function showProductImage(imageSource) {

        if (!productImage) return;

        productImage.src = imageSource;

        productImage.style.display = "block";


        if (imagePlaceholder) {
            imagePlaceholder.style.display = "none";
        }


        if (modalImage) {
            modalImage.src = imageSource;
        }
    }


    /* =====================================================
       SHOW PLACEHOLDER
    ===================================================== */

    function showPlaceholder() {

        if (productImage) {

            productImage.style.display = "none";

            productImage.removeAttribute("src");
        }


        if (imagePlaceholder) {
            imagePlaceholder.style.display = "flex";
        }
    }


    /* =====================================================
       AI OCR ANALYSIS
    ===================================================== */

    async function analyzeProductWithAI(imageData) {

        showAIStatus(
            "Analyzing product label with AI OCR...",
            "loading"
        );


        try {

            /*
             * Convert Base64 data URL to Blob
             */

            const response =
                await fetch(imageData);

            const blob =
                await response.blob();


            /*
             * Create multipart form
             */

            const formData =
                new FormData();

            formData.append(
                "image",
                blob,
                "scanned-product.jpg"
            );


            /*
             * Send image to Flask AI service
             */

            const aiResponse =
                await fetch(
                    AI_SERVICE_URL,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!aiResponse.ok) {

                throw new Error(
                    `AI service returned HTTP ${aiResponse.status}`
                );
            }


            const result =
                await aiResponse.json();


            console.log(
                "AI Analysis Result:",
                result
            );


            if (
                !result ||
                result.status !== "success"
            ) {

                throw new Error(
                    "AI analysis failed."
                );
            }


            /*
             * Save complete AI response
             */

            localStorage.setItem(
                "aiAnalysisResult",
                JSON.stringify(result)
            );


            /*
             * Auto-fill inspection form
             */

            populateInspectionForm(
                result.extracted_data ||
                result.product ||
                {}
            );


            /*
             * Update checklist
             */

            updateChecklist(
                result
            );


            /*
             * Show success

             */

            showAIStatus(
                "AI analysis completed. Please review the extracted information.",
                "success"
            );


        } catch (error) {

            console.error(
                "AI OCR Error:",
                error
            );


            showAIStatus(
                "AI analysis could not be completed. Please enter or verify the information manually.",
                "error"
            );
        }
    }


    /* =====================================================
       POPULATE INSPECTION FORM
    ===================================================== */

    function populateInspectionForm(data) {

        /*
         * Product name
         */

        setValue(
            "productName",
            cleanValue(data.product_name)
        );


        /*
         * Manufacturer
         */

        setValue(
            "manufacturer",
            cleanValue(data.manufacturer)
        );


        /*
         * Net quantity
         */

        setValue(
            "netQuantity",
            cleanValue(data.net_quantity)
        );


        /*
         * MRP
         */

        setValue(
            "mrp",
            cleanValue(data.mrp)
        );


        /*
         * Consumer care
         */

        setValue(
            "consumerCare",
            cleanValue(data.customer_care)
        );


        /*
         * Manufacturer address
         */

        setValue(
            "address",
            cleanValue(data.manufacturer_address)
        );


        /*
         * Packing / manufacturing date
         */

        const dateValue =
            cleanValue(
                data.date_of_manufacture
            );

        setValue(
            "packingDate",
            dateValue
        );


        /*
         * Additional declarations
         */

        const additional = [];

        if (data.brand_name) {
            additional.push(
                `Brand: ${data.brand_name}`
            );
        }

        if (data.brand_owner) {
            additional.push(
                `Brand Owner: ${data.brand_owner}`
            );
        }

        if (data.country_of_origin) {
            additional.push(
                `Country of Origin: ${data.country_of_origin}`
            );
        }

        if (data.fssai_license) {
            additional.push(
                `FSSAI License: ${data.fssai_license}`
            );
        }

        if (data.epr_registration) {
            additional.push(
                `EPR Registration: ${data.epr_registration}`
            );
        }

        if (data.batch_number) {
            additional.push(
                `Batch No.: ${data.batch_number}`
            );
        }

        if (data.use_by) {
            additional.push(
                `Use By: ${data.use_by}`
            );
        }

        if (data.ingredients) {
            additional.push(
                `Ingredients: ${data.ingredients}`
            );
        }


        setValue(
            "additionalDeclarations",
            additional.join("\n")
        );
    }


    /* =====================================================
       CLEAN VALUE
    ===================================================== */

    function cleanValue(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value).trim();
    }


    /* =====================================================
       SET INPUT VALUE
    ===================================================== */

    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (!element) return;

        if (
            value !== undefined &&
            value !== null
        ) {

            element.value = value;
        }
    }


    /* =====================================================
       CHECKLIST UPDATE
    ===================================================== */

    function updateChecklist(result) {

        const data =
            result.extracted_data ||
            result.product ||
            {};

        updateCheckItem(
            "Name of Commodity",
            !!data.product_name
        );

        updateCheckItem(
            "Net Quantity",
            !!data.net_quantity
        );

        updateCheckItem(
            "MRP Declaration",
            !!data.mrp
        );

        updateCheckItem(
            "Manufacturer Details",
            !!data.manufacturer
        );

        updateCheckItem(
            "Packing Details",
            !!(
                data.date_of_manufacture ||
                data.use_by
            )
        );

        updateCheckItem(
            "Consumer Care",
            !!data.customer_care
        );
    }


    /* =====================================================
       UPDATE INDIVIDUAL CHECK ITEM
    ===================================================== */

    function updateCheckItem(
        title,
        detected
    ) {

        const items =
            document.querySelectorAll(
                ".check-item"
            );


        items.forEach(item => {

            const strong =
                item.querySelector("strong");

            if (!strong) return;


            if (
                strong.textContent.trim() !==
                title
            ) {
                return;
            }


            const icon =
                item.querySelector(".check-icon");

            const status =
                item.querySelector(".check-status");


            if (detected) {

                if (icon) {

                    icon.textContent = "✓";

                    icon.classList.remove(
                        "pending"
                    );

                    icon.classList.add(
                        "verified"
                    );
                }


                if (status) {
                    status.textContent =
                        "Detected";
                }


            } else {

                if (icon) {

                    icon.textContent = "?";

                    icon.classList.add(
                        "pending"
                    );
                }


                if (status) {
                    status.textContent =
                        "Review";
                }
            }

        });
    }


    /* =====================================================
       AI STATUS MESSAGE
    ===================================================== */

    function showAIStatus(
        message,
        type
    ) {

        let statusBox =
            document.getElementById(
                "aiStatusBox"
            );


        if (!statusBox) {

            statusBox =
                document.createElement("div");

            statusBox.id =
                "aiStatusBox";

            statusBox.style.cssText = `
                margin: 16px 0;
                padding: 14px 16px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #dbe3ea;
                background: #f7f9fb;
            `;


            if (inspectionForm) {

                inspectionForm.parentElement.insertBefore(
                    statusBox,
                    inspectionForm
                );
            }
        }


        statusBox.textContent =
            message;


        if (type === "loading") {

            statusBox.style.background =
                "#fff8e6";

            statusBox.style.borderColor =
                "#f0d58c";

            statusBox.style.color =
                "#8a6500";

        } else if (type === "success") {

            statusBox.style.background =
                "#edf9f2";

            statusBox.style.borderColor =
                "#ccebd8";

            statusBox.style.color =
                "#187348";

        } else {

            statusBox.style.background =
                "#fff1f1";

            statusBox.style.borderColor =
                "#f1caca";

            statusBox.style.color =
                "#a12626";
        }
    }


    /* =====================================================
       RETAKE
    ===================================================== */

    if (retakeBtn) {

        retakeBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../scan.html";
            }
        );
    }


    /* =====================================================
       IMAGE ZOOM
    ===================================================== */

    if (zoomBtn) {

        zoomBtn.addEventListener(
            "click",
            () => {

                if (
                    !productImage ||
                    !productImage.src
                ) {

                    alert(
                        "No product image available."
                    );

                    return;
                }


                if (
                    productImage.style.display ===
                    "none"
                ) {

                    alert(
                        "Please scan or upload a product image first."
                    );

                    return;
                }


                if (modalImage) {
                    modalImage.src =
                        productImage.src;
                }


                if (imageModal) {

                    imageModal.hidden = false;

                    document.body.style.overflow =
                        "hidden";
                }
            }
        );
    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeImageModal() {

        if (imageModal) {
            imageModal.hidden = true;
        }

        document.body.style.overflow = "";
    }


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeImageModal
        );
    }


    if (imageModal) {

        imageModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === imageModal
                ) {

                    closeImageModal();
                }
            }
        );
    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                imageModal &&
                !imageModal.hidden
            ) {

                closeImageModal();
            }
        }
    );


    /* =====================================================
       FORM DATA
    ===================================================== */

    function getFormData() {

        return {

            inspectionId,

            manufacturer:
                getInputValue("manufacturer"),

            productName:
                getInputValue("productName"),

            netQuantity:
                getInputValue("netQuantity"),

            mrp:
                getInputValue("mrp"),

            packingDate:
                getInputValue("packingDate"),

            consumerCare:
                getInputValue("consumerCare"),

            address:
                getInputValue("address"),

            additionalDeclarations:
                getInputValue(
                    "additionalDeclarations"
                ),

            productImage:
                localStorage.getItem(
                    "scannedProductImage"
                ) || "",

            officerName:
                savedOfficerName || "",

            officerId:
                savedOfficerId || "",

            aiAnalysis:
                JSON.parse(
                    localStorage.getItem(
                        "aiAnalysisResult"
                    ) || "null"
                ),

            savedAt:
                new Date().toISOString()
        };
    }


    /* =====================================================
       GET INPUT VALUE
    ===================================================== */

    function getInputValue(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";
    }


    /* =====================================================
       SAVE DRAFT
    ===================================================== */

    if (saveDraftBtn) {

        saveDraftBtn.addEventListener(
            "click",
            () => {

                const data =
                    getFormData();

                localStorage.setItem(
                    "inspectionDraft",
                    JSON.stringify(data)
                );

                showMessage(
                    "Inspection draft saved successfully."
                );
            }
        );
    }


    /* =====================================================
       LOAD EXISTING DRAFT
    ===================================================== */

    const savedDraft =
        localStorage.getItem(
            "inspectionDraft"
        );


    if (savedDraft) {

        try {

            const data =
                JSON.parse(savedDraft);


            setValue(
                "manufacturer",
                data.manufacturer
            );

            setValue(
                "productName",
                data.productName
            );

            setValue(
                "netQuantity",
                data.netQuantity
            );

            setValue(
                "mrp",
                data.mrp
            );

            setValue(
                "packingDate",
                data.packingDate
            );

            setValue(
                "consumerCare",
                data.consumerCare
            );

            setValue(
                "address",
                data.address
            );

            setValue(
                "additionalDeclarations",
                data.additionalDeclarations
            );

        } catch (error) {

            console.error(
                "Unable to load inspection draft:",
                error
            );
        }
    }


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    if (inspectionForm) {

        inspectionForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const productImageData =
                    localStorage.getItem(
                        "scannedProductImage"
                    );


                if (!productImageData) {

                    alert(
                        "Please scan or upload a product image before continuing."
                    );

                    return;
                }


                const data =
                    getFormData();


                localStorage.setItem(
                    "currentInspection",
                    JSON.stringify(data)
                );


                localStorage.removeItem(
                    "inspectionDraft"
                );


                window.location.href =
                    "compliance.html";
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
                    "inspectionDraft"
                );

                localStorage.removeItem(
                    "currentInspection"
                );

                localStorage.removeItem(
                    "aiAnalysisResult"
                );


                window.location.href =
                    "login.html";
            }
        );
    }


    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(message) {
        alert(message);
    }

});