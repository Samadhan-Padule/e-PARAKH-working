/* =========================================================
   e-PARAKH — PRODUCT INSPECTION JS
   MASTER CORRECTED VERSION

   FIXES:
   - AI OCR request timeout
   - Prevents infinite "Analyzing..." state
   - Prevents duplicate AI requests
   - Safe Base64 image handling
   - Image remains in sessionStorage
   - AI result stored safely
   - Handles Flask 200/500 responses
   - Handles invalid JSON
   - Handles network/CORS errors
   - Manual verification remains possible
   - Draft save/load
   - Compliance navigation
   - Logout
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("=================================");
    console.log("e-PARAKH Inspection JS loaded");
    console.log("=================================");


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
        "http://127.0.0.1:8000/analyze";


    /*
     * Maximum time allowed for OCR request.
     *
     * 3 minutes is enough for local PaddleOCR
     * in most development systems.
     */

    const AI_TIMEOUT_MS =
        180000;


    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const IMAGE_STORAGE_KEY =
        "eParakhCapturedImage";

    const CURRENT_INSPECTION_KEY =
        "currentInspection";

    const DRAFT_KEY =
        "inspectionDraft";

    const AI_RESULT_KEY =
        "aiAnalysisResult";

    const INSPECTION_ID_KEY =
        "currentInspectionId";


    /* =====================================================
       OFFICER DATA
    ===================================================== */

    const savedOfficerName =
        localStorage.getItem("officerName") || "";

    const savedOfficerId =
        localStorage.getItem("officerId") || "";


    if (officerName) {

        officerName.textContent =
            savedOfficerName || "Authorized Officer";

    }


    if (officerId) {

        officerId.textContent =
            savedOfficerId || "Officer";

    }


    /* =====================================================
       OFFICER INITIALS
    ===================================================== */

    if (officerInitials) {

        const name =
            savedOfficerName.trim();

        if (name) {

            const words =
                name.split(/\s+/);

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

            officerInitials.textContent =
                initials;

        } else {

            officerInitials.textContent =
                "AO";

        }

    }


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    let inspectionId =
        localStorage.getItem(
            INSPECTION_ID_KEY
        );


    if (!inspectionId) {

        inspectionId =
            generateInspectionId();

        try {

            localStorage.setItem(
                INSPECTION_ID_KEY,
                inspectionId
            );

        } catch (error) {

            console.warn(
                "Inspection ID could not be stored:",
                error
            );

        }

    }


    if (inspectionIdElement) {

        inspectionIdElement.textContent =
            inspectionId;

    }


    function generateInspectionId() {

        const year =
            new Date().getFullYear();

        const randomNumber =
            String(
                Date.now()
            ).slice(-6);

        return `EP-${year}-${randomNumber}`;

    }


    /* =====================================================
       AI REQUEST CONTROL
    ===================================================== */

    let aiRequestRunning = false;

    let aiCompleted = false;


    /* =====================================================
       LOAD IMAGE
    ===================================================== */

    const savedImage =
        sessionStorage.getItem(
            IMAGE_STORAGE_KEY
        );


    console.log(
        "Image in sessionStorage:",
        !!savedImage
    );


    if (savedImage) {

        showProductImage(
            savedImage
        );


        /*
         * Start AI only once.
         */

        analyzeProductWithAI(
            savedImage
        );

    } else {

        showPlaceholder();

        showAIStatus(
            "No product image found. Please scan or upload a product image.",
            "error"
        );

    }


    /* =====================================================
       SHOW PRODUCT IMAGE
    ===================================================== */

    function showProductImage(
        imageSource
    ) {

        if (!productImage) {

            console.warn(
                "productImage element not found."
            );

            return;

        }


        productImage.src =
            imageSource;

        productImage.style.display =
            "block";


        if (imagePlaceholder) {

            imagePlaceholder.style.display =
                "none";

        }


        if (modalImage) {

            modalImage.src =
                imageSource;

        }

    }


    /* =====================================================
       SHOW PLACEHOLDER
    ===================================================== */

    function showPlaceholder() {

        if (productImage) {

            productImage.style.display =
                "none";

            productImage.removeAttribute(
                "src"
            );

        }


        if (imagePlaceholder) {

            imagePlaceholder.style.display =
                "flex";

        }

    }
    /* =====================================================
   MULTI-PANEL IMAGE LOADER
===================================================== */

const PANEL_DB_NAME = "eParakhScannerDB";
const PANEL_DB_VERSION = 1;
const PANEL_STORE_NAME = "panelImages";
async function loadPanelImagesFromDB() {

    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {
            resolve([]);
            return;
        }

        const request = indexedDB.open(
            PANEL_DB_NAME,
            PANEL_DB_VERSION
        );

        request.onsuccess = () => {

            const db = request.result;

            if (!db.objectStoreNames.contains(PANEL_STORE_NAME)) {
                db.close();
                resolve([]);
                return;
            }

            try {

                const transaction = db.transaction(
                    PANEL_STORE_NAME,
                    "readonly"
                );

                const store = transaction.objectStore(
                    PANEL_STORE_NAME
                );

                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {

                    let images =
                        getAllRequest.result || [];

                    /*
                     * IMPORTANT:
                     * Only use the latest scan session.
                     *
                     * Scanner records contain createdAt.
                     * We sort newest first and keep the
                     * latest records belonging to the
                     * current scan.
                     */

                    images.sort(
                        (a, b) =>
                            (b.createdAt || 0) -
                            (a.createdAt || 0)
                    );

                    /*
                     * For the current demo:
                     * maximum 7 images are supported.
                     *
                     * Take the newest records only.
                     */

                    images =
                        images.slice(0, 7);

                    /*
                     * Restore normal display order.
                     */

                    images.sort(
                        (a, b) =>
                            (a.panel || "").localeCompare(
                                b.panel || ""
                            )
                    );

                    console.log(
                        "LATEST SCAN IMAGES:",
                        images.length
                    );

                    console.log(
                        "LATEST SCAN PANELS:",
                        images.map(
                            image => image.panel
                        )
                    );

                    db.close();

                    resolve(images);

                };

                getAllRequest.onerror = () => {

                    db.close();

                    reject(
                        getAllRequest.error
                    );

                };

            } catch (error) {

                db.close();

                reject(error);

            }

        };

        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}
    /* =====================================================
       AI OCR ANALYSIS
    ===================================================== */

    async function analyzeProductWithAI(
        imageData
    ) {

        /*
         * Prevent duplicate request.
         */

        if (aiRequestRunning) {

            console.warn(
                "AI request already running."
            );

            return;

        }


        if (aiCompleted) {

            console.log(
                "AI analysis already completed."
            );

            return;

        }


        if (!imageData) {

            showAIStatus(
                "Product image is missing.",
                "error"
            );

            return;

        }


        aiRequestRunning =
            true;


        showAIStatus(
            "Analyzing product label with AI OCR...",
            "loading"
        );


        console.log("=================================");
        console.log("AI OCR START");
        console.log("Image available:", !!imageData);
        console.log(
            "Image length:",
            imageData.length
        );
        console.log(
            "AI URL:",
            AI_SERVICE_URL
        );
        console.log("=================================");


        try {

            /* =================================================
   STEP 1 — PREPARE MULTI-PANEL IMAGES
================================================= */

showAIStatus(
    "Preparing product images for AI OCR...",
    "loading"
);

let imagesToAnalyze = [];

/*
 * New multi-panel flow
 */
if (Array.isArray(imageData)) {

    imagesToAnalyze = imageData;

} else if (imageData) {

    /*
     * Backward compatibility:
     * old single FRONT image
     */
    imagesToAnalyze = [
        {
            panel: "FRONT",
            dataUrl: imageData,
            name: "scanned-product.jpg",
            type: "image/jpeg"
        }
    ];

}


if (!imagesToAnalyze.length) {

    throw new Error(
        "No product images available for OCR."
    );

}


console.log(
    "Images to analyze:",
    imagesToAnalyze.length
);

console.log(
    "Panels:",
    imagesToAnalyze.map(
        image => image.panel
    )
);


/* =================================================
   STEP 2 — ANALYZE EACH PANEL
================================================= */

const analysisResults = [];

for (
    let i = 0;
    i < imagesToAnalyze.length;
    i++
) {

    const panelImage =
        imagesToAnalyze[i];

    showAIStatus(
        `Analyzing ${panelImage.panel} panel (${i + 1}/${imagesToAnalyze.length})...`,
        "loading"
    );

    console.log(
        `OCR ${i + 1}/${imagesToAnalyze.length}:`,
        panelImage.panel
    );


    const imageResponse =
        await fetch(
            panelImage.dataUrl
        );


    if (!imageResponse.ok) {

        console.warn(
            `Unable to read ${panelImage.panel} image. Skipping.`
        );

        continue;

    }


    const blob =
        await imageResponse.blob();


    if (!blob.size) {

        console.warn(
            `Empty image for ${panelImage.panel}. Skipping.`
        );

        continue;

    }


    const formData =
        new FormData();


    formData.append(
        "image",
        blob,
        panelImage.name ||
        `${panelImage.panel}-panel.jpg`
    );


    console.log(
        `Sending ${panelImage.panel} → POST /analyze`
    );


    const panelController =
        new AbortController();


    const panelTimeout =
        setTimeout(
            () => panelController.abort(),
            AI_TIMEOUT_MS
        );


    try {

        const panelResponse =
            await fetch(
                `${AI_SERVICE_URL}/analyze`,
                {
                    method: "POST",
                    body: formData,
                    signal:
                        panelController.signal
                }
            );


        clearTimeout(
            panelTimeout
        );


        if (!panelResponse.ok) {

            console.warn(
                `${panelImage.panel} OCR failed: HTTP ${panelResponse.status}`
            );

            continue;

        }


        const panelResult =
            await panelResponse.json();


        if (
            panelResult.status !==
            "success"
        ) {

            console.warn(
                `${panelImage.panel} OCR returned an error:`,
                panelResult.message
            );

            continue;

        }


        analysisResults.push({

            panel:
                panelImage.panel,

            result:
                panelResult

        });


        console.log(
            `${panelImage.panel} OCR completed successfully.`
        );


    } catch (panelError) {

        clearTimeout(
            panelTimeout
        );

        console.warn(
            `${panelImage.panel} OCR request failed:`,
            panelError
        );

    }

}


if (!analysisResults.length) {

    throw new Error(
        "AI OCR failed for all product images."
    );

}


console.log(
    "================================="
);

console.log(
    "MULTI-PANEL OCR COMPLETE"
);

console.log(
    "Successful panels:",
    analysisResults.length
);

console.log(
    "Panels:",
    analysisResults.map(
        item => item.panel
    )
);

console.log(
    "================================="
);


/* =================================================
   BUILD COMBINED RESULT
================================================= */

/*
 * Keep FRONT as the primary result so the
 * existing compliance/result UI continues
 * to work.
 */

const frontAnalysis =
    analysisResults.find(
        item =>
            item.panel === "FRONT"
    );


const primaryResult =
    frontAnalysis
        ? frontAnalysis.result
        : analysisResults[0].result;


/*
 * Combine OCR text from every panel.
 */

const combinedOcrText =
    analysisResults
        .map(item => {

            const text =
                item.result.raw_ocr_text ||
                item.result.rawOcrText ||
                "";

            if (!text) return "";

            return `[${item.panel}]\n${text}`;

        })
        .filter(Boolean)
        .join("\n\n");


/*
 * Combine extracted data.
 */

const combinedExtractedData =
    analysisResults.reduce(
        (combined, item) => {

            const data =
                item.result.extracted_data ||
                item.result.extractedData ||
                item.result.product ||
                {};

            return {
                ...combined,
                ...data
            };

        },
        {}
    );


/*
 * Keep the existing FRONT compliance result
 * as the primary compliance result.
 */

const combinedResult = {

    ...primaryResult,

    raw_ocr_text:
        combinedOcrText,

    extracted_data:
        combinedExtractedData,

    multi_panel_analysis:
        analysisResults.map(
            item => ({
                panel:
                    item.panel,
                result:
                    item.result
            })
        )

};


console.log(
    "Combined OCR text length:",
    combinedOcrText.length
);

console.log(
    "Combined extracted data:",
    combinedExtractedData
);


            /* =================================================
               STEP 3 — ABORT CONTROLLER
            ================================================= */

            const controller =
                new AbortController();


            const timeout =
                setTimeout(
                    () => {

                        console.warn(
                            "AI request timeout reached."
                        );

                        controller.abort();

                    },
                    AI_TIMEOUT_MS
                );


            /* =================================================
               STEP 4 — SEND TO FLASK
            ================================================= */

            showAIStatus(
                "AI OCR is processing the product label. Please wait...",
                "loading"
            );


            console.log(
                "STEP 3: Sending POST /analyze..."
            );

            console.log(
                "Timeout:",
                AI_TIMEOUT_MS / 1000,
                "seconds"
            );


            let aiResponse;


            try {

                aiResponse =
                    await fetch(
                        AI_SERVICE_URL,
                        {
                            method: "POST",
                            body: formData,
                            signal:
                                controller.signal
                        }
                    );

            } finally {

                clearTimeout(
                    timeout
                );

            }


            console.log(
                "AI HTTP response:",
                aiResponse.status
            );


            /* =================================================
               STEP 5 — READ RESPONSE AS TEXT FIRST
            ================================================= */

            showAIStatus(
                "AI OCR response received. Reading analysis...",
                "loading"
            );


            const responseText =
                await aiResponse.text();


            console.log(
                "Response length:",
                responseText.length
            );


            if (!responseText) {

                throw new Error(
                    "AI service returned an empty response."
                );

            }


            console.log(
                "Response preview:",
                responseText.substring(
                    0,
                    500
                )
            );


            /* =================================================
               STEP 6 — HTTP ERROR
            ================================================= */

            if (!aiResponse.ok) {

                throw new Error(
                    `AI service returned HTTP ${aiResponse.status}: ${responseText.substring(0, 300)}`
                );

            }


            /* =================================================
               STEP 7 — JSON PARSE
            ================================================= */

            let result;


            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch (jsonError) {

                console.error(
                    "Invalid JSON from AI service:",
                    jsonError
                );


                throw new Error(
                    "AI service returned invalid JSON."
                );

            }


            console.log(
                "================================="
            );

            console.log(
                "FULL AI RESPONSE:"
            );

            console.log(
                result
            );

            console.log(
                "================================="
            );


            if (
                !result ||
                typeof result !== "object"
            ) {

                throw new Error(
                    "AI returned an invalid response."
                );

            }


            /* =================================================
               STEP 8 — EXTRACT DATA
            ================================================= */

            const extractedData =
                result.extracted_data ||
                result.product ||
                result.data ||
                {};


            console.log(
                "EXTRACTED DATA:",
                extractedData
            );


            /* =================================================
               STEP 9 — SAVE AI RESULT
            ================================================= */

            safeSaveAIResult(
                result
            );


            /* =================================================
               STEP 10 — POPULATE FORM
            ================================================= */

            populateInspectionForm(
                extractedData
            );


            /* =================================================
               STEP 11 — UPDATE CHECKLIST
            ================================================= */

            updateChecklist(
                {
                    extracted_data:
                        extractedData
                }
            );


            /* =================================================
               STEP 12 — SUCCESS
            ================================================= */

            aiCompleted =
                true;

            aiRequestRunning =
                false;


            showAIStatus(
                "AI analysis completed successfully. Please review the extracted information before continuing.",
                "success"
            );


            console.log(
                "================================="
            );

            console.log(
                "AI OCR COMPLETED SUCCESSFULLY"
            );

            console.log(
                "================================="
            );


        } catch (error) {

            aiRequestRunning =
                false;


            console.error(
                "================================="
            );

            console.error(
                "AI OCR ERROR"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );


            if (
                error.name ===
                "AbortError"
            ) {

                showAIStatus(
                    "AI OCR timed out after 3 minutes. Please verify the extracted information manually or try scanning again.",
                    "error"
                );

            }

            else {

                showAIStatus(
                    "AI OCR could not be completed. You may continue with manual verification.",
                    "error"
                );

            }


            /*
             * IMPORTANT:
             *
             * AI failure must NOT block officer.
             */

            console.warn(
                "Manual verification is available."
            );

        }

    }


    /* =====================================================
       SAFE SAVE AI RESULT
    ===================================================== */

    function safeSaveAIResult(
        result
    ) {

        try {

            const json =
                JSON.stringify(
                    result
                );


            /*
             * AI response can be large.
             *
             * Use sessionStorage first because
             * it is temporary inspection data.
             */

            try {

                sessionStorage.setItem(
                    AI_RESULT_KEY,
                    json
                );

                console.log(
                    "AI result saved to sessionStorage."
                );

                return true;

            } catch (
                sessionError
            ) {

                console.warn(
                    "AI result could not be saved to sessionStorage:",
                    sessionError
                );

            }


            /*
             * Fallback to localStorage.
             */

            try {

                localStorage.setItem(
                    AI_RESULT_KEY,
                    json
                );

                console.log(
                    "AI result saved to localStorage."
                );

                return true;

            } catch (
                localError
            ) {

                console.warn(
                    "AI result could not be saved to localStorage:",
                    localError
                );

            }


            return false;

        } catch (error) {

            console.warn(
                "AI result serialization failed:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       GET SAVED AI RESULT
    ===================================================== */

    function getSavedAIResult() {

        let raw =
            sessionStorage.getItem(
                AI_RESULT_KEY
            );


        if (!raw) {

            raw =
                localStorage.getItem(
                    AI_RESULT_KEY
                );

        }


        if (!raw) {

            return null;

        }


        try {

            return JSON.parse(
                raw
            );

        } catch (error) {

            console.warn(
                "Invalid stored AI result:",
                error
            );

            return null;

        }

    }


    /* =====================================================
       POPULATE INSPECTION FORM
    ===================================================== */

    function populateInspectionForm(
        data
    ) {

        if (!data) {

            return;

        }


        console.log(
            "Populating inspection form..."
        );


        setValue(
            "productName",
            cleanValue(
                data.product_name
            )
        );


        setValue(
            "manufacturer",
            cleanValue(
                data.manufacturer
            )
        );


        setValue(
            "netQuantity",
            cleanValue(
                data.net_quantity
            )
        );


        setValue(
            "mrp",
            cleanValue(
                data.mrp
            )
        );


        setValue(
            "consumerCare",
            cleanValue(
                data.customer_care
            )
        );


        setValue(
            "address",
            cleanValue(
                data.manufacturer_address
            )
        );


        setValue(
            "packingDate",
            cleanValue(
                data.date_of_manufacture
            )
        );


        const additional =
            [];


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


        console.log(
            "Inspection form populated."
        );

    }


    /* =====================================================
       CLEAN VALUE
    ===================================================== */

    function cleanValue(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(
            value
        ).trim();

    }


    /* =====================================================
       SET VALUE
    ===================================================== */

    function setValue(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {

            return;

        }


        element.value =
            cleanValue(
                value
            );

    }


    /* =====================================================
       GET INPUT VALUE
    ===================================================== */

    function getInputValue(
        id
    ) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {

            return "";

        }


        return element.value.trim();

    }


    /* =====================================================
       CHECKLIST
    ===================================================== */

    function updateChecklist(
        result
    ) {

        const data =
            result.extracted_data ||
            result.product ||
            result.data ||
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
       UPDATE CHECK ITEM
    ===================================================== */

    function updateCheckItem(
        title,
        detected
    ) {

        const items =
            document.querySelectorAll(
                ".check-item"
            );


        items.forEach(
            item => {

                const strong =
                    item.querySelector(
                        "strong"
                    );


                if (!strong) {

                    return;

                }


                if (
                    strong.textContent.trim() !==
                    title
                ) {

                    return;

                }


                const icon =
                    item.querySelector(
                        ".check-icon"
                    );


                const status =
                    item.querySelector(
                        ".check-status"
                    );


                if (detected) {

                    if (icon) {

                        icon.textContent =
                            "✓";

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

                        icon.textContent =
                            "?";

                        icon.classList.remove(
                            "verified"
                        );

                        icon.classList.add(
                            "pending"
                        );

                    }


                    if (status) {

                        status.textContent =
                            "Review";

                    }

                }

            }
        );

    }


    /* =====================================================
       AI STATUS
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
                document.createElement(
                    "div"
                );


            statusBox.id =
                "aiStatusBox";


            statusBox.style.cssText = `
                margin:16px 0;
                padding:14px 16px;
                border-radius:10px;
                font-size:13px;
                font-weight:600;
                border:1px solid #dbe3ea;
                background:#f7f9fb;
                line-height:1.5;
            `;


            if (
                inspectionForm &&
                inspectionForm.parentElement
            ) {

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

        }

        else if (
            type === "success"
        ) {

            statusBox.style.background =
                "#edf9f2";

            statusBox.style.borderColor =
                "#ccebd8";

            statusBox.style.color =
                "#187348";

        }

        else {

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

                /*
                 * Clear previous AI state.
                 */

                try {

                    sessionStorage.removeItem(
                        AI_RESULT_KEY
                    );

                } catch (error) {

                    console.warn(
                        error
                    );

                }


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
                    !productImage.src ||
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

                    imageModal.hidden =
                        false;

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

            imageModal.hidden =
                true;

        }


        document.body.style.overflow =
            "";

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
                    event.target ===
                    imageModal
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
       GET FORM DATA
    ===================================================== */

    function getFormData() {

        const aiAnalysis =
            getSavedAIResult();


        return {

            inspectionId:
                inspectionId,

            manufacturer:
                getInputValue(
                    "manufacturer"
                ),

            productName:
                getInputValue(
                    "productName"
                ),

            netQuantity:
                getInputValue(
                    "netQuantity"
                ),

            mrp:
                getInputValue(
                    "mrp"
                ),

            packingDate:
                getInputValue(
                    "packingDate"
                ),

            consumerCare:
                getInputValue(
                    "consumerCare"
                ),

            address:
                getInputValue(
                    "address"
                ),

            additionalDeclarations:
                getInputValue(
                    "additionalDeclarations"
                ),

            /*
             * NEVER store Base64 image here.
             */

            productImage:
                null,

            imageStorageKey:
                IMAGE_STORAGE_KEY,

            officerName:
                savedOfficerName,

            officerId:
                savedOfficerId,

            aiAnalysis:
                aiAnalysis,

            savedAt:
                new Date().toISOString()

        };

    }


    /* =====================================================
       SAFE LOCAL STORAGE
    ===================================================== */

    function safeLocalStorageSet(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                `Unable to save ${key}:`,
                error
            );


            /*
             * Cleanup only temporary data.
             */

            try {

                localStorage.removeItem(
                    DRAFT_KEY
                );

                localStorage.removeItem(
                    AI_RESULT_KEY
                );

            } catch (
                cleanupError
            ) {

                console.warn(
                    "Storage cleanup failed:",
                    cleanupError
                );

            }


            /*
             * Retry once.
             */

            try {

                localStorage.setItem(
                    key,
                    JSON.stringify(value)
                );

                return true;

            } catch (
                retryError
            ) {

                console.error(
                    "Storage retry failed:",
                    retryError
                );

                return false;

            }

        }

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


                /*
                 * Explicit safety.
                 */

                data.productImage =
                    null;


                const saved =
                    safeLocalStorageSet(
                        DRAFT_KEY,
                        data
                    );


                if (saved) {

                    showMessage(
                        "Inspection draft saved successfully."
                    );

                } else {

                    showMessage(
                        "Draft could not be saved. Please continue with the inspection."
                    );

                }

            }
        );

    }


    /* =====================================================
       LOAD DRAFT
    ===================================================== */

    const savedDraft =
        localStorage.getItem(
            DRAFT_KEY
        );


    if (savedDraft) {

        try {

            const data =
                JSON.parse(
                    savedDraft
                );


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


            /*
             * Legacy migration.
             */

            const currentImage =
                sessionStorage.getItem(
                    IMAGE_STORAGE_KEY
                );


            if (
                !currentImage &&
                data.productImage
            ) {

                try {

                    sessionStorage.setItem(
                        IMAGE_STORAGE_KEY,
                        data.productImage
                    );


                    showProductImage(
                        data.productImage
                    );

                } catch (
                    sessionError
                ) {

                    console.warn(
                        "Unable to restore old draft image:",
                        sessionError
                    );

                }

            }

        } catch (error) {

            console.error(
                "Unable to load inspection draft:",
                error
            );

        }

    }


    /* =====================================================
       FORM SUBMIT
       CONTINUE TO COMPLIANCE
    ===================================================== */

    if (inspectionForm) {

        inspectionForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const productImageData =
                    sessionStorage.getItem(
                        IMAGE_STORAGE_KEY
                    );


                if (!productImageData) {

                    alert(
                        "Please scan or upload a product image before continuing."
                    );

                    return;

                }


                const data =
                    getFormData();


                /*
                 * ABSOLUTE SAFETY:
                 * Never put Base64 into localStorage.
                 */

                data.productImage =
                    null;


                data.imageStorageKey =
                    IMAGE_STORAGE_KEY;


                const saved =
                    safeLocalStorageSet(
                        CURRENT_INSPECTION_KEY,
                        data
                    );


                if (!saved) {

                    console.warn(
                        "currentInspection could not be stored."
                    );

                }


                try {

                    localStorage.removeItem(
                        DRAFT_KEY
                    );

                } catch (error) {

                    console.warn(
                        "Unable to remove draft:",
                        error
                    );

                }


                /*
                 * Navigate to compliance.
                 */

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
                    DRAFT_KEY
                );


                localStorage.removeItem(
                    CURRENT_INSPECTION_KEY
                );


                localStorage.removeItem(
                    INSPECTION_ID_KEY
                );


                localStorage.removeItem(
                    AI_RESULT_KEY
                );


                sessionStorage.removeItem(
                    IMAGE_STORAGE_KEY
                );


                sessionStorage.removeItem(
                    AI_RESULT_KEY
                );


                window.location.href =
                    "login.html";

            }
        );

    }


    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(
        message
    ) {

        alert(
            message
        );

    }


    /* =====================================================
       FINAL DEBUG
    ===================================================== */

    console.log(
        "Inspection ID:",
        inspectionId
    );

    console.log(
        "AI Service:",
        AI_SERVICE_URL
    );

    console.log(
        "AI Timeout:",
        AI_TIMEOUT_MS / 1000,
        "seconds"
    );

    console.log(
        "Image in sessionStorage:",
        !!sessionStorage.getItem(
            IMAGE_STORAGE_KEY
        )
    );

    console.log(
        "================================="
    );

});