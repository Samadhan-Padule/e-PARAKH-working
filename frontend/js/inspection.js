/* =========================================================
   e-PARAKH — PRODUCT INSPECTION JS
   MASTER CORRECTED VERSION

   FEATURES:
   - Multi-panel image support
   - FRONT / BACK / SIDE / TOP / BOTTOM / MRP / OTHER
   - IndexedDB panel image loading
   - Multi-panel AI OCR
   - Combined OCR result
   - Combined extracted declarations
   - FRONT result used as primary compliance result
   - AI request timeout
   - Prevents duplicate AI requests
   - Safe Base64 image handling
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
       INDEXEDDB — MULTI-PANEL STORAGE
    ===================================================== */

    const PANEL_DB_NAME =
        "eParakhScannerDB";

    const PANEL_DB_VERSION = 3;

    const PANEL_STORE_NAME =
        "panelImages";


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

    let aiRequestRunning =
        false;

    let aiCompleted =
        false;


    /* =====================================================
       LOAD MULTI-PANEL IMAGES FROM INDEXEDDB
    ===================================================== */

    async function loadPanelImagesFromDB() {

    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {
            resolve([]);
            return;
        }

        /*
         * =====================================================
         * CURRENT CAMERA STORAGE
         * =====================================================
         *
         * DB:
         * eParakhEvidenceDB
         *
         * Store:
         * inspectionEvidence
         *
         * Values are DataURL strings.
         *
         * Keys:
         * front, back, side, batch
         */

        const DB_NAME = "eParakhEvidenceDB";
        const STORE_NAME = "inspectionEvidence";

        const request = indexedDB.open(DB_NAME);

        request.onerror = () => {

            console.error(
                "Unable to open evidence IndexedDB:",
                request.error
            );

            resolve([]);
        };

        request.onsuccess = () => {

            const db = request.result;

            try {

                if (
                    !db.objectStoreNames.contains(
                        STORE_NAME
                    )
                ) {

                    console.warn(
                        "Evidence store not found:",
                        STORE_NAME
                    );

                    db.close();

                    resolve([]);

                    return;
                }

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );

                const getAllKeysRequest =
                    store.getAllKeys();

                const getAllValuesRequest =
                    store.getAll();

                getAllKeysRequest.onerror = () => {

                    console.error(
                        "Unable to read evidence keys:",
                        getAllKeysRequest.error
                    );

                    db.close();

                    resolve([]);
                };

                getAllValuesRequest.onerror = () => {

                    console.error(
                        "Unable to read evidence images:",
                        getAllValuesRequest.error
                    );

                    db.close();

                    resolve([]);
                };

                /*
                 * Wait for both keys and values.
                 */

                let keys = null;
                let values = null;

                function finishIfReady() {

                    if (
                        !keys ||
                        !values
                    ) {
                        return;
                    }

                    const images = [];

                    for (
                        let i = 0;
                        i < keys.length;
                        i++
                    ) {

                        const key =
                            String(
                                keys[i]
                            ).toLowerCase();

                        const dataUrl =
                            values[i];

                        if (
                            typeof dataUrl === "string" &&
                            dataUrl.startsWith("data:image/")
                        ) {

                            images.push({
                                panel:
                                    key.toUpperCase(),

                                dataUrl:
                                    dataUrl
                            });
                        }
                    }

                    /*
                     * Keep a predictable order.
                     */

                    const order = [
                        "FRONT",
                        "BACK",
                        "SIDE",
                        "BATCH"
                    ];

                    images.sort(
                        (a, b) =>
                            order.indexOf(a.panel) -
                            order.indexOf(b.panel)
                    );

                    console.log(
                        "Evidence images loaded:",
                        images.length
                    );

                    console.log(
                        "Evidence panels:",
                        images.map(
                            image =>
                                image.panel
                        )
                    );

                    db.close();

                    resolve(images);
                }

                getAllKeysRequest.onsuccess = () => {

                    keys =
                        getAllKeysRequest.result || [];

                    finishIfReady();
                };

                getAllValuesRequest.onsuccess = () => {

                    values =
                        getAllValuesRequest.result || [];

                    finishIfReady();
                }

            } catch (error) {

                console.error(
                    "Evidence IndexedDB transaction error:",
                    error
                );

                db.close();

                resolve([]);
            }
        };
    });
}
    /* =====================================================
       INITIALIZE INSPECTION IMAGES
    ===================================================== */

    async function initializeInspectionImages() {

        try {

            const panelImages =
                await loadPanelImagesFromDB();


            console.log(
                "Panel images found:",
                panelImages.length
            );


            console.log(
                "Panels:",
                panelImages.map(
                    image => image.panel
                )
            );


            /* ==========================================
               MULTI-PANEL FLOW
            ========================================== */

            if (
                panelImages.length > 0
            ) {

                const frontImage =
                    panelImages.find(
                        image =>
                            image.panel === "FRONT"
                    );


                /*
                 * Show FRONT as main preview.
                 */

                if (frontImage) {

                    showProductImage(
                        frontImage.dataUrl
                    );


                    /*
                     * Backward compatibility.
                     */

                    try {

                        sessionStorage.setItem(
                            IMAGE_STORAGE_KEY,
                            frontImage.dataUrl
                        );

                    } catch (storageError) {

                        console.warn(
                            "Unable to save FRONT image:",
                            storageError
                        );

                    }

                } else {

                    /*
                     * No FRONT image.
                     * Show first available panel.
                     */

                    showProductImage(
                        panelImages[0].dataUrl
                    );

                }


                /*
                 * Start multi-panel AI.
                 */

                await analyzeProductWithAI(
                    panelImages
                );


                return;

            }


            /* ==========================================
               LEGACY SINGLE IMAGE FALLBACK
            ========================================== */

            const savedImage =
                sessionStorage.getItem(
                    IMAGE_STORAGE_KEY
                );


            console.log(
                "Legacy image available:",
                !!savedImage
            );


            if (savedImage) {

                showProductImage(
                    savedImage
                );


                await analyzeProductWithAI(
                    savedImage
                );

            } else {

                showPlaceholder();


                showAIStatus(
                    "No product image found. Please scan or upload a product image.",
                    "error"
                );

            }

        } catch (error) {

            console.error(
                "Unable to initialize inspection images:",
                error
            );


            /*
             * Fallback to legacy image.
             */

            const savedImage =
                sessionStorage.getItem(
                    IMAGE_STORAGE_KEY
                );


            if (savedImage) {

                showProductImage(
                    savedImage
                );


                await analyzeProductWithAI(
                    savedImage
                );

            } else {

                showPlaceholder();


                showAIStatus(
                    "Unable to load product images. You may continue with manual verification.",
                    "error"
                );

            }

        }

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
       AI OCR ANALYSIS
    ===================================================== */

    async function analyzeProductWithAI(
        imageData
    ) {

        /*
         * Prevent duplicate requests.
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


        console.log(
            "AI Service:",
            AI_SERVICE_URL
        );


        console.log(
            "AI Timeout:",
            AI_TIMEOUT_MS / 1000,
            "seconds"
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


            let imagesToAnalyze =
                [];


            /*
             * Multi-panel input.
             */

            if (
                Array.isArray(imageData)
            ) {

                imagesToAnalyze =
                    imageData;

            }


            /*
             * Legacy single image.
             */

            else if (
                imageData
            ) {

                imagesToAnalyze = [

                    {
                        panel:
                            "FRONT",

                        dataUrl:
                            imageData,

                        name:
                            "scanned-product.jpg",

                        type:
                            "image/jpeg"

                    }

                ];

            }


            if (
                !imagesToAnalyze.length
            ) {

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
                    image =>
                        image.panel
                )
            );


            /* =================================================
               STEP 2 — ANALYZE EACH PANEL
            ================================================= */

            const analysisResults =
                [];


            for (
                let i = 0;
                i < imagesToAnalyze.length;
                i++
            ) {

                const panelImage =
                    imagesToAnalyze[i];


                const panelName =
                    panelImage.panel ||
                    "OTHER";


                showAIStatus(
                    `Analyzing ${panelName} panel (${i + 1}/${imagesToAnalyze.length})...`,
                    "loading"
                );


                console.log(
                    `OCR ${i + 1}/${imagesToAnalyze.length}:`,
                    panelName
                );


                if (
                    !panelImage.dataUrl
                ) {

                    console.warn(
                        `${panelName} image has no data URL. Skipping.`
                    );

                    continue;

                }


                let imageResponse;


                try {

                    /*
                     * Convert Data URL into Blob.
                     */

                    imageResponse =
                        await fetch(
                            panelImage.dataUrl
                        );

                } catch (imageError) {

                    console.warn(
                        `Unable to read ${panelName} image:`,
                        imageError
                    );

                    continue;

                }


                if (
                    !imageResponse.ok
                ) {

                    console.warn(
                        `Unable to read ${panelName} image. HTTP ${imageResponse.status}`
                    );

                    continue;

                }


                const blob =
                    await imageResponse.blob();


                if (
                    !blob ||
                    !blob.size
                ) {

                    console.warn(
                        `Empty image for ${panelName}. Skipping.`
                    );

                    continue;

                }


                const formData =
                    new FormData();


                formData.append(
                    "image",
                    blob,
                    panelImage.name ||
                    `${panelName}-panel.jpg`
                );


                console.log(
                    `Sending ${panelName} → POST /analyze`
                );


                const panelController =
                    new AbortController();


                const panelTimeout =
                    setTimeout(
                        () => {

                            console.warn(
                                `${panelName} OCR timeout reached.`
                            );

                            panelController.abort();

                        },
                        AI_TIMEOUT_MS
                    );


                try {

                    /*
                     * IMPORTANT:
                     *
                     * AI_SERVICE_URL already contains:
                     * http://127.0.0.1:8000/analyze
                     *
                     * Therefore DO NOT add /analyze again.
                     */

                    const panelResponse =
                        await fetch(
                            AI_SERVICE_URL,
                            {
                                method:
                                    "POST",

                                body:
                                    formData,

                                signal:
                                    panelController.signal
                            }
                        );


                    clearTimeout(
                        panelTimeout
                    );


                    console.log(
                        `${panelName} HTTP status:`,
                        panelResponse.status
                    );


                    if (
                        !panelResponse.ok
                    ) {

                        const errorText =
                            await panelResponse.text();


                        console.warn(
                            `${panelName} OCR failed: HTTP ${panelResponse.status}`,
                            errorText.substring(
                                0,
                                300
                            )
                        );


                        continue;

                    }


                    const responseText =
                        await panelResponse.text();


                    if (
                        !responseText
                    ) {

                        console.warn(
                            `${panelName} OCR returned empty response.`
                        );

                        continue;

                    }


                    let panelResult;


                    try {

                        panelResult =
                            JSON.parse(
                                responseText
                            );

                    } catch (jsonError) {

                        console.warn(
                            `${panelName} returned invalid JSON:`,
                            jsonError
                        );

                        continue;

                    }


                    if (
                        !panelResult ||
                        typeof panelResult !==
                            "object"
                    ) {

                        console.warn(
                            `${panelName} returned invalid AI data.`
                        );

                        continue;

                    }


                    /*
                     * Some Flask implementations
                     * may not include status.
                     *
                     * Treat HTTP 200 JSON as success
                     * unless explicitly marked as error.
                     */

                    if (
                        panelResult.status ===
                        "error"
                    ) {

                        console.warn(
                            `${panelName} OCR returned an error:`,
                            panelResult.message
                        );

                        continue;

                    }


                    analysisResults.push({

                        panel:
                            panelName,

                        result:
                            panelResult

                    });


                    console.log(
                        `${panelName} OCR completed successfully.`
                    );

                } catch (panelError) {

                    clearTimeout(
                        panelTimeout
                    );


                    console.warn(
                        `${panelName} OCR request failed:`,
                        panelError
                    );

                }

            }


            /* =================================================
               VERIFY RESULTS
            ================================================= */

            if (
                !analysisResults.length
            ) {

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
                    item =>
                        item.panel
                )
            );


            console.log(
                "================================="
            );


            /* =================================================
               BUILD COMBINED RESULT
            ================================================= */

            /*
             * FRONT remains primary result.
             */

            const frontAnalysis =
                analysisResults.find(
                    item =>
                        item.panel ===
                        "FRONT"
                );


            const primaryResult =
                frontAnalysis
                    ? frontAnalysis.result
                    : analysisResults[0].result;


            /*
             * Combine OCR text.
             */

            const combinedOcrText =
                analysisResults
                    .map(
                        item => {

                            const text =
                                item.result.raw_ocr_text ||
                                item.result.rawOcrText ||
                                "";


                            if (
                                !text
                            ) {

                                return "";

                            }


                            return (
                                `[${item.panel}]\n` +
                                text
                            );

                        }
                    )
                    .filter(Boolean)
                    .join(
                        "\n\n"
                    );


            /*
             * Combine extracted data.
             */

            const combinedExtractedData =
                analysisResults.reduce(
                    (
                        combined,
                        item
                    ) => {

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
             * Combined final result.
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
               STEP 3 — PROCESS COMBINED RESULT
            ================================================= */

            const result =
                combinedResult;


            console.log(
                "================================="
            );


            console.log(
                "COMBINED AI RESPONSE:"
            );


            console.log(
                result
            );


            console.log(
                "================================="
            );


            if (
                !result ||
                typeof result !==
                    "object"
            ) {

                throw new Error(
                    "AI returned an invalid combined response."
                );

            }


            /* =================================================
               EXTRACT DATA
            ================================================= */

            const extractedData =
                result.extracted_data ||
                result.product ||
                result.data ||
                {};


            console.log(
                "COMBINED EXTRACTED DATA:",
                extractedData
            );


            /* =================================================
               SAVE AI RESULT
            ================================================= */

            safeSaveAIResult(
                result
            );


            /* =================================================
               POPULATE FORM
            ================================================= */

            populateInspectionForm(
                extractedData
            );


            /* =================================================
               UPDATE CHECKLIST
            ================================================= */

            updateChecklist(
                {
                    extracted_data:
                        extractedData
                }
            );


            /* =================================================
               SUCCESS
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
                "MULTI-PANEL AI OCR COMPLETED"
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

            } else {

                showAIStatus(
                    "AI OCR could not be completed. You may continue with manual verification.",
                    "error"
                );

            }


            /*
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


        if (
            type === "loading"
        ) {

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
                    "scan.html";

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
            async () => {

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


                /*
                 * Clear multi-panel IndexedDB.
                 */

                try {

                    if (
                        window.indexedDB
                    ) {

                        const request =
                            indexedDB.deleteDatabase(
                                PANEL_DB_NAME
                            );


                        request.onsuccess = () => {

                            console.log(
                                "Multi-panel scanner data cleared."
                            );

                        };


                        request.onerror = () => {

                            console.warn(
                                "Unable to clear scanner database."
                            );

                        };

                    }

                } catch (error) {

                    console.warn(
                        "IndexedDB cleanup failed:",
                        error
                    );

                }


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


    /* =====================================================
       START INSPECTION IMAGE LOADING
    ===================================================== */

    initializeInspectionImages();

});


