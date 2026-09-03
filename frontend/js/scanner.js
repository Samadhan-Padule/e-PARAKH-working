/* =========================================================
   e-PARAKH
   PRODUCT SCANNER / CAMERA
   FULL CORRECTED VERSION

   Responsibilities:
   - Camera access
   - Front / Back / Side / Top / Bottom / MRP / Other panels
   - Camera capture
   - Upload support
   - Retake
   - IndexedDB evidence storage
   - Inspection ID linking
   - Continue to inspection page

   IMPORTANT:
   - Does NOT calculate compliance
   - Does NOT modify compliance.js
   - Does NOT clear previous inspection evidence
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const cameraContainer =
        document.getElementById("cameraContainer");

    const cameraPreview =
        document.getElementById("cameraPreview");

    const cameraPlaceholder =
        document.getElementById("cameraPlaceholder");

    const cameraOverlay =
        document.getElementById("cameraOverlay");

    const cameraError =
        document.getElementById("cameraError");

    const cameraErrorMessage =
        document.getElementById("cameraErrorMessage");

    const startCameraBtn =
        document.getElementById("startCameraBtn");

    const retryCameraBtn =
        document.getElementById("retryCameraBtn");

    const switchCameraBtn =
        document.getElementById("switchCameraBtn");

    const captureBtn =
        document.getElementById("captureBtn");

    const stopCameraBtn =
        document.getElementById("stopCameraBtn");

    const capturePreviewContainer =
        document.getElementById("capturePreviewContainer");

    const capturedImage =
        document.getElementById("capturedImage");

    const retakeBtn =
        document.getElementById("retakeBtn");

    const continueBtn =
        document.getElementById("continueBtn");

    const currentYear =
        document.getElementById("currentYear");


    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!cameraContainer) {
        console.error(
            "e-PARAKH Scanner: cameraContainer not found."
        );
        return;
    }


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    if (currentYear) {
        currentYear.textContent =
            new Date().getFullYear();
    }


    /* =====================================================
       CAMERA STATE
    ===================================================== */

    let cameraStream = null;

    let currentFacingMode = "environment";

    let currentPanel = "FRONT";

    let currentCapturedFile = null;

    let currentPreviewUrl = null;


    /* =====================================================
       PANEL DEFINITIONS
    ===================================================== */

    const PANELS = {
        FRONT: "Front",
        BACK: "Back",
        SIDE: "Side",
        TOP: "Top",
        BOTTOM: "Bottom",
        MRP_PANEL: "MRP",
        OTHER: "Other"
    };


    /* =====================================================
       INDEXED DB CONFIGURATION
       Version 4 is intentionally used so older versions
       can be upgraded safely.
    ===================================================== */

    const DB_NAME = "eParakhScannerDB";

    const DB_VERSION = 4;

    const STORE_NAME = "panelImages";


    /* =====================================================
       OPEN INDEXED DB
    ===================================================== */

    function openPanelDB() {

        return new Promise((resolve, reject) => {

            if (!window.indexedDB) {
                reject(
                    new Error(
                        "IndexedDB is not supported by this browser."
                    )
                );

                return;
            }

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );


            request.onupgradeneeded = (event) => {

                const db =
                    event.target.result;

                let store;


                /* -----------------------------------------
                   Create store if it does not exist
                   ----------------------------------------- */

                if (
                    !db.objectStoreNames.contains(
                        STORE_NAME
                    )
                ) {

                    store =
                        db.createObjectStore(
                            STORE_NAME,
                            {
                                keyPath: "id"
                            }
                        );

                } else {

                    store =
                        event.target.transaction
                            .objectStore(
                                STORE_NAME
                            );
                }


                /* -----------------------------------------
                   Create indexes if missing
                   ----------------------------------------- */

                if (
                    !store.indexNames.contains(
                        "inspectionId"
                    )
                ) {

                    store.createIndex(
                        "inspectionId",
                        "inspectionId",
                        {
                            unique: false
                        }
                    );
                }


                if (
                    !store.indexNames.contains(
                        "panel"
                    )
                ) {

                    store.createIndex(
                        "panel",
                        "panel",
                        {
                            unique: false
                        }
                    );
                }


                if (
                    !store.indexNames.contains(
                        "createdAt"
                    )
                ) {

                    store.createIndex(
                        "createdAt",
                        "createdAt",
                        {
                            unique: false
                        }
                    );
                }
            };


            request.onsuccess = () => {

                resolve(
                    request.result
                );
            };


            request.onerror = () => {

                reject(
                    request.error
                );
            };


            request.onblocked = () => {

                console.warn(
                    "IndexedDB upgrade is blocked. Close other e-PARAKH tabs."
                );
            };
        });
    }


    /* =====================================================
       INSPECTION ID
    ===================================================== */

    function generateInspectionId() {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        const random =
            Math.floor(
                100000 +
                Math.random() * 900000
            );

        return `EP-${year}-${month}${day}-${random}`;
    }


    function getCurrentInspectionId() {

        /* -----------------------------------------
           First priority: localStorage
           ----------------------------------------- */

        const storedId =
            localStorage.getItem(
                "currentInspectionId"
            );

        if (storedId) {
            return storedId;
        }


        /* -----------------------------------------
           Try currentInspection
           ----------------------------------------- */

        try {

            const savedInspection =
                JSON.parse(
                    localStorage.getItem(
                        "currentInspection"
                    ) || "null"
                );

            if (
                savedInspection &&
                savedInspection.inspectionId
            ) {

                return savedInspection.inspectionId;
            }


            if (
                savedInspection &&
                savedInspection.id
            ) {

                return savedInspection.id;
            }

        } catch (error) {

            console.warn(
                "Unable to read currentInspection:",
                error
            );
        }


        /* -----------------------------------------
           Try sessionStorage
           ----------------------------------------- */

        const sessionId =
            sessionStorage.getItem(
                "currentInspectionId"
            );

        if (sessionId) {
            return sessionId;
        }


        /* -----------------------------------------
           Create new inspection ID
           ----------------------------------------- */

        const newId =
            generateInspectionId();

        localStorage.setItem(
            "currentInspectionId",
            newId
        );

        sessionStorage.setItem(
            "currentInspectionId",
            newId
        );


        return newId;
    }


    const inspectionId =
        getCurrentInspectionId();


    console.log(
        "e-PARAKH Scanner - Inspection ID:",
        inspectionId
    );


    /* =====================================================
       CURRENT PANEL
    ===================================================== */

    function createPanelSelector() {

        if (
            document.getElementById(
                "panelSelector"
            )
        ) {
            return;
        }


        const selector =
            document.createElement(
                "div"
            );

        selector.id =
            "panelSelector";


        selector.style.cssText = `
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            margin:18px 0;
            align-items:center;
        `;


        const title =
            document.createElement(
                "span"
            );

        title.textContent =
            "Package Panel:";

        title.style.cssText = `
            font-weight:700;
            font-size:14px;
            margin-right:4px;
        `;

        selector.appendChild(title);


        Object.entries(PANELS)
            .forEach(
                ([value, label]) => {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.dataset.panel =
                        value;

                    button.textContent =
                        label;


                    button.style.cssText = `
                        padding:8px 13px;
                        border:1px solid #d1d5db;
                        border-radius:8px;
                        background:#ffffff;
                        cursor:pointer;
                        font-weight:600;
                        font-size:13px;
                        transition:all .2s ease;
                    `;


                    button.addEventListener(
                        "click",
                        () => {

                            currentPanel =
                                value;

                            updatePanelButtons();

                            updateCaptureButton();

                            loadExistingPanelPreview();
                        }
                    );


                    selector.appendChild(
                        button
                    );
                }
            );


        const heading =
            document.querySelector(
                ".scanner-heading"
            );


        if (heading) {

            heading.after(
                selector
            );

        } else {

            cameraContainer.before(
                selector
            );
        }


        updatePanelButtons();
    }


    function updatePanelButtons() {

        const buttons =
            document.querySelectorAll(
                "#panelSelector button[data-panel]"
            );


        buttons.forEach(
            (button) => {

                const active =
                    button.dataset.panel ===
                    currentPanel;


                button.style.background =
                    active
                        ? "#0f766e"
                        : "#ffffff";

                button.style.color =
                    active
                        ? "#ffffff"
                        : "#111827";

                button.style.borderColor =
                    active
                        ? "#0f766e"
                        : "#d1d5db";

                button.style.fontWeight =
                    active
                        ? "800"
                        : "600";
            }
        );
    }


    createPanelSelector();


    /* =====================================================
       CAMERA START
    ===================================================== */

    if (startCameraBtn) {

        startCameraBtn.addEventListener(
            "click",
            startCamera
        );
    }


    if (retryCameraBtn) {

        retryCameraBtn.addEventListener(
            "click",
            startCamera
        );
    }


    async function startCamera() {

        try {

            hideCameraError();


            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                showCameraError(
                    "Camera access is not supported by this browser."
                );

                return;
            }


            stopCameraTracks();


            cameraStream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: {
                                ideal:
                                    currentFacingMode
                            },

                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }
                        },

                        audio: false
                    }
                );


            cameraPreview.srcObject =
                cameraStream;


            await cameraPreview.play();


            showCameraActive();


            console.log(
                "Camera started:",
                currentFacingMode
            );

        } catch (error) {

            console.error(
                "Camera Error:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                showCameraError(
                    "Camera permission was denied. Please allow camera access in your browser and try again."
                );

            } else if (
                error.name ===
                "NotFoundError"
            ) {

                showCameraError(
                    "No camera was found on this device."
                );

            } else if (
                error.name ===
                "NotReadableError"
            ) {

                showCameraError(
                    "The camera is already being used by another application."
                );

            } else {

                showCameraError(
                    "Unable to access the camera. Please check your browser permissions."
                );
            }
        }
    }


    /* =====================================================
       CAMERA UI
    ===================================================== */

    function showCameraActive() {

        if (cameraPlaceholder) {

            cameraPlaceholder.classList.add(
                "hidden"
            );
        }


        if (cameraError) {

            cameraError.classList.add(
                "hidden"
            );
        }


        if (cameraOverlay) {

            cameraOverlay.classList.remove(
                "hidden"
            );
        }


        cameraContainer.classList.add(
            "camera-active"
        );


        if (captureBtn) {

            captureBtn.disabled =
                false;
        }


        if (stopCameraBtn) {

            stopCameraBtn.disabled =
                false;
        }


        if (switchCameraBtn) {

            switchCameraBtn.disabled =
                false;
        }


        updateCaptureButton();
    }


    function showCameraPlaceholder() {

        if (cameraPlaceholder) {

            cameraPlaceholder.classList.remove(
                "hidden"
            );
        }


        if (cameraOverlay) {

            cameraOverlay.classList.add(
                "hidden"
            );
        }


        if (captureBtn) {

            captureBtn.disabled =
                true;
        }


        if (stopCameraBtn) {

            stopCameraBtn.disabled =
                true;
        }


        if (switchCameraBtn) {

            switchCameraBtn.disabled =
                true;
        }


        cameraContainer.classList.remove(
            "camera-active"
        );
    }


    function showCameraError(message) {

        stopCameraTracks();


        if (cameraErrorMessage) {

            cameraErrorMessage.textContent =
                message;
        }


        if (cameraPlaceholder) {

            cameraPlaceholder.classList.add(
                "hidden"
            );
        }


        if (cameraOverlay) {

            cameraOverlay.classList.add(
                "hidden"
            );
        }


        if (cameraError) {

            cameraError.classList.remove(
                "hidden"
            );
        }


        if (captureBtn) {

            captureBtn.disabled =
                true;
        }


        if (stopCameraBtn) {

            stopCameraBtn.disabled =
                true;
        }


        if (switchCameraBtn) {

            switchCameraBtn.disabled =
                true;
        }
    }


    function hideCameraError() {

        if (cameraError) {

            cameraError.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       CAPTURE BUTTON LABEL
    ===================================================== */

    function updateCaptureButton() {

        if (!captureBtn) {
            return;
        }


        captureBtn.setAttribute(
            "aria-label",
            `Capture ${PANELS[currentPanel]} panel`
        );
    }


    /* =====================================================
       SWITCH CAMERA
    ===================================================== */

    if (switchCameraBtn) {

        switchCameraBtn.addEventListener(
            "click",
            async () => {

                if (!cameraStream) {
                    return;
                }


                currentFacingMode =
                    currentFacingMode ===
                    "environment"
                        ? "user"
                        : "environment";


                await startCamera();
            }
        );
    }


    /* =====================================================
       CAPTURE IMAGE
    ===================================================== */

    if (captureBtn) {

        captureBtn.addEventListener(
            "click",
            captureImage
        );
    }


    function captureImage() {

        if (
            !cameraStream ||
            !cameraPreview ||
            cameraPreview.readyState <
                2
        ) {

            alert(
                "Camera is not ready yet. Please wait a moment."
            );

            return;
        }


        const width =
            cameraPreview.videoWidth ||
            1280;

        const height =
            cameraPreview.videoHeight ||
            720;


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            width;

        canvas.height =
            height;


        const context =
            canvas.getContext(
                "2d"
            );


        context.drawImage(
            cameraPreview,
            0,
            0,
            width,
            height
        );


        canvas.toBlob(
            async (blob) => {

                if (!blob) {

                    alert(
                        "Unable to capture image."
                    );

                    return;
                }


                const file =
                    new File(
                        [
                            blob
                        ],
                        `${currentPanel}-panel-${Date.now()}.jpg`,
                        {
                            type:
                                "image/jpeg"
                        }
                    );


                try {

                    await savePanelImage(
                        currentPanel,
                        file,
                        "camera"
                    );


                    currentCapturedFile =
                        file;


                    showCapturedImage(
                        file
                    );


                    stopCamera();


                    showSuccess(
                        `${PANELS[currentPanel]} panel captured successfully.`
                    );


                } catch (error) {

                    console.error(
                        "Image save error:",
                        error
                    );


                    alert(
                        "Image was captured but could not be saved.\n\n" +
                        error.message
                    );
                }

            },
            "image/jpeg",
            0.92
        );
    }


    /* =====================================================
       SAVE PANEL IMAGE
    ===================================================== */

    async function savePanelImage(
        panel,
        file,
        source = "upload"
    ) {

        const dataUrl =
            await fileToDataUrl(
                file
            );


        const db =
            await openPanelDB();


        return new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                /*
                 * Remove an older image for the
                 * SAME inspection + SAME panel.
                 *
                 * Other inspections remain untouched.
                 */

                const request =
                    store.getAll();


                request.onsuccess =
                    () => {

                        const records =
                            request.result ||
                            [];


                        records.forEach(
                            (record) => {

                                if (
                                    record.inspectionId ===
                                        inspectionId &&
                                    record.panel ===
                                        panel
                                ) {

                                    store.delete(
                                        record.id
                                    );
                                }
                            }
                        );


                        const imageRecord = {

                            id:
                                `${inspectionId}-${panel}-${Date.now()}-${Math.random()
                                    .toString(36)
                                    .slice(2, 8)}`,

                            inspectionId:
                                inspectionId,

                            panel:
                                panel,

                            name:
                                file.name,

                            type:
                                file.type ||
                                "image/jpeg",

                            dataUrl:
                                dataUrl,

                            createdAt:
                                new Date().toISOString(),

                            source:
                                source
                        };


                        store.put(
                            imageRecord
                        );
                    };


                request.onerror =
                    () => {

                        reject(
                            request.error
                        );
                    };


                transaction.oncomplete =
                    () => {

                        db.close();

                        resolve();
                    };


                transaction.onerror =
                    () => {

                        db.close();

                        reject(
                            transaction.error
                        );
                    };
            }
        );
    }


    /* =====================================================
       FILE → DATA URL
    ===================================================== */

    function fileToDataUrl(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        resolve(
                            reader.result
                        );
                    };


                reader.onerror =
                    () => {

                        reject(
                            reader.error
                        );
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /* =====================================================
       LOAD EXISTING PANEL PREVIEW
    ===================================================== */

    async function loadExistingPanelPreview() {

        try {

            const db =
                await openPanelDB();


            const records =
                await new Promise(
                    (resolve, reject) => {

                        const transaction =
                            db.transaction(
                                STORE_NAME,
                                "readonly"
                            );


                        const store =
                            transaction.objectStore(
                                STORE_NAME
                            );


                        const request =
                            store.getAll();


                        request.onsuccess =
                            () => {

                                resolve(
                                    request.result ||
                                    []
                                );
                            };


                        request.onerror =
                            () => {

                                reject(
                                    request.error
                                );
                            };
                    }
                );


            db.close();


            const record =
                records
                    .filter(
                        item =>
                            item.inspectionId ===
                                inspectionId &&
                            item.panel ===
                                currentPanel
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                b.createdAt
                            ) -
                            new Date(
                                a.createdAt
                            )
                    )[0];


            if (!record) {

                hideCapturedPreview();

                return;
            }


            if (record.dataUrl) {

                if (currentPreviewUrl) {

                    URL.revokeObjectURL(
                        currentPreviewUrl
                    );

                    currentPreviewUrl =
                        null;
                }


                capturedImage.src =
                    record.dataUrl;


                capturedImage.alt =
                    `${PANELS[currentPanel]} panel`;


                capturePreviewContainer.classList.remove(
                    "hidden"
                );


                continueBtn.disabled =
                    false;
            }

        } catch (error) {

            console.warn(
                "Unable to load existing panel image:",
                error
            );
        }
    }


    /* =====================================================
       SHOW CAPTURED IMAGE
    ===================================================== */

    function showCapturedImage(file) {

        if (!file) {
            return;
        }


        if (currentPreviewUrl) {

            URL.revokeObjectURL(
                currentPreviewUrl
            );
        }


        currentPreviewUrl =
            URL.createObjectURL(
                file
            );


        capturedImage.src =
            currentPreviewUrl;


        capturedImage.alt =
            `${PANELS[currentPanel]} panel`;


        capturePreviewContainer.classList.remove(
            "hidden"
        );


        continueBtn.disabled =
            false;
    }


    /* =====================================================
       HIDE PREVIEW
    ===================================================== */

    function hideCapturedPreview() {

        if (currentPreviewUrl) {

            URL.revokeObjectURL(
                currentPreviewUrl
            );

            currentPreviewUrl =
                null;
        }


        if (capturedImage) {

            capturedImage.src =
                "";
        }


        if (capturePreviewContainer) {

            capturePreviewContainer.classList.add(
                "hidden"
            );
        }
    }


    /* =====================================================
       STOP CAMERA
    ===================================================== */

    if (stopCameraBtn) {

        stopCameraBtn.addEventListener(
            "click",
            stopCamera
        );
    }


    function stopCamera() {

        stopCameraTracks();

        showCameraPlaceholder();
    }


    function stopCameraTracks() {

        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

            cameraStream =
                null;
        }


        if (cameraPreview) {

            cameraPreview.srcObject =
                null;
        }
    }


    /* =====================================================
       RETAKE
    ===================================================== */

    if (retakeBtn) {

        retakeBtn.addEventListener(
            "click",
            async () => {

                await deleteCurrentPanelImage();

                currentCapturedFile =
                    null;

                hideCapturedPreview();

                await startCamera();
            }
        );
    }


    /* =====================================================
       DELETE CURRENT PANEL IMAGE
    ===================================================== */

    async function deleteCurrentPanelImage() {

        try {

            const db =
                await openPanelDB();


            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            STORE_NAME,
                            "readwrite"
                        );


                    const store =
                        transaction.objectStore(
                            STORE_NAME
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const records =
                                request.result ||
                                [];


                            records.forEach(
                                record => {

                                    if (
                                        record.inspectionId ===
                                            inspectionId &&
                                        record.panel ===
                                            currentPanel
                                    ) {

                                        store.delete(
                                            record.id
                                        );
                                    }
                                }
                            );
                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );
                        };


                    transaction.oncomplete =
                        () => {

                            resolve();
                        };


                    transaction.onerror =
                        () => {

                            reject(
                                transaction.error
                            );
                        };
                }
            );


            db.close();

        } catch (error) {

            console.warn(
                "Unable to delete panel image:",
                error
            );
        }
    }


    /* =====================================================
       UPLOAD BUTTON
       
       Your supplied HTML does not contain an upload
       input, so create one without changing the HTML.
    ===================================================== */

    createUploadControl();


    function createUploadControl() {

        if (
            document.getElementById(
                "productImage"
            )
        ) {

            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.style.cssText = `
            margin-top:18px;
            padding:16px;
            border:1px dashed #cbd5e1;
            border-radius:12px;
            background:#f8fafc;
            text-align:center;
        `;


        const label =
            document.createElement(
                "label"
            );


        label.htmlFor =
            "productImage";


        label.textContent =
            `Upload ${PANELS[currentPanel]} Panel`;


        label.style.cssText = `
            display:block;
            margin-bottom:10px;
            font-weight:700;
        `;


        const input =
            document.createElement(
                "input"
            );


        input.type =
            "file";

        input.id =
            "productImage";

        input.accept =
            "image/jpeg,image/png,image/webp";

        input.style.cssText = `
            max-width:100%;
        `;


        input.addEventListener(
            "change",
            handleFileUpload
        );


        wrapper.appendChild(
            label
        );

        wrapper.appendChild(
            input
        );


        cameraContainer.after(
            wrapper
        );


        window.eParakhUploadWrapper =
            wrapper;
    }


    /* =====================================================
       UPLOAD IMAGE
    ===================================================== */

    async function handleFileUpload(event) {

        const file =
            event.target.files &&
            event.target.files[0];


        if (!file) {
            return;
        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please select a JPG, PNG or WEBP image."
            );


            event.target.value =
                "";


            return;
        }


        const maxSize =
            10 * 1024 * 1024;


        if (file.size > maxSize) {

            alert(
                "Image size must be less than 10 MB."
            );


            event.target.value =
                "";


            return;
        }


        try {

            await savePanelImage(
                currentPanel,
                file,
                "upload"
            );


            currentCapturedFile =
                file;


            showCapturedImage(
                file
            );


            showSuccess(
                `${PANELS[currentPanel]} panel uploaded successfully.`
            );

        } catch (error) {

            console.error(
                "Upload save error:",
                error
            );


            alert(
                "Unable to save the uploaded image.\n\n" +
                error.message
            );
        }


        event.target.value =
            "";
    }


    /* =====================================================
       UPDATE UPLOAD LABEL WHEN PANEL CHANGES
    ===================================================== */

    function updateUploadLabel() {

        const label =
            document.querySelector(
                'label[for="productImage"]'
            );


        if (label) {

            label.textContent =
                `Upload ${PANELS[currentPanel]} Panel`;
        }
    }


    /* =====================================================
       PANEL CHANGE OBSERVER
    ===================================================== */

    const panelSelector =
        document.getElementById(
            "panelSelector"
        );


    if (panelSelector) {

        panelSelector.addEventListener(
            "click",
            () => {

                setTimeout(
                    updateUploadLabel,
                    0
                );
            }
        );
    }


    /* =====================================================
       CONTINUE TO INSPECTION
    ===================================================== */

    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            analyzeProduct
        );
    }


    async function analyzeProduct() {

        try {

            /*
             * FRONT PANEL IS REQUIRED.
             */

            const frontImage =
                await getPanelImage(
                    "FRONT"
                );


            if (!frontImage) {

                alert(
                    "Please scan or upload the FRONT panel image first."
                );


                currentPanel =
                    "FRONT";


                updatePanelButtons();

                updateUploadLabel();

                await loadExistingPanelPreview();

                return;
            }


            continueBtn.disabled =
                true;


            const originalText =
                continueBtn.innerHTML;


            continueBtn.innerHTML =
                `
                <span>Preparing Inspection...</span>
                <span class="loading-spinner"></span>
                `;


            /*
             * Save front image for legacy
             * inspection/OCR code.
             */

            const frontDataUrl =
                frontImage.dataUrl;


            if (frontDataUrl) {

                sessionStorage.setItem(
                    "eParakhCapturedImage",
                    frontDataUrl
                );


                /*
                 * Legacy compatibility only.
                 * Evidence remains in IndexedDB.
                 */

                localStorage.setItem(
                    "scannedProductImage",
                    frontDataUrl
                );
            }


            /*
             * Save panel metadata.
             */

            const panelMetadata =
                await getPanelMetadata();


            sessionStorage.setItem(
                "panelImages",
                JSON.stringify(
                    panelMetadata
                )
            );


            /*
             * Current inspection information.
             */

            sessionStorage.setItem(
                "inspectionStarted",
                "true"
            );


            sessionStorage.setItem(
                "currentInspectionId",
                inspectionId
            );


            localStorage.setItem(
                "currentInspectionId",
                inspectionId
            );


            /*
             * Create/update currentInspection
             * WITHOUT touching complianceResult.
             */

            let currentInspection = {};


            try {

                currentInspection =
                    JSON.parse(
                        localStorage.getItem(
                            "currentInspection"
                        ) || "{}"
                    );

            } catch (error) {

                currentInspection =
                    {};
            }


            currentInspection.inspectionId =
                inspectionId;


            currentInspection.startedAt =
                currentInspection.startedAt ||
                new Date().toISOString();


            currentInspection.status =
                currentInspection.status ||
                "IN_PROGRESS";


            localStorage.setItem(
                "currentInspection",
                JSON.stringify(
                    currentInspection
                )
            );


            /*
             * Navigate.
             *
             * Change this ONLY if your
             * inspection.html is located elsewhere.
             */

            window.location.href =
                "inspection.html";

        } catch (error) {

            console.error(
                "Scanner Error:",
                error
            );


            alert(
                "Unable to continue with inspection.\n\n" +
                error.message
            );


            continueBtn.disabled =
                false;


            continueBtn.innerHTML =
                "Continue";
        }
    }


    /* =====================================================
       GET PANEL IMAGE
    ===================================================== */

    async function getPanelImage(panel) {

        const db =
            await openPanelDB();


        return new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readonly"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                const request =
                    store.getAll();


                request.onsuccess =
                    () => {

                        const records =
                            request.result ||
                            [];


                        const matching =
                            records
                                .filter(
                                    record =>
                                        record.inspectionId ===
                                            inspectionId &&
                                        record.panel ===
                                            panel
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(
                                            b.createdAt
                                        ) -
                                        new Date(
                                            a.createdAt
                                        )
                                );


                        db.close();


                        resolve(
                            matching[0] ||
                            null
                        );
                    };


                request.onerror =
                    () => {

                        db.close();

                        reject(
                            request.error
                        );
                    };
            }
        );
    }


    /* =====================================================
       GET ALL PANEL METADATA
    ===================================================== */

    async function getPanelMetadata() {

        const db =
            await openPanelDB();


        return new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readonly"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                const request =
                    store.getAll();


                request.onsuccess =
                    () => {

                        const records =
                            request.result ||
                            [];


                        const metadata = {};


                        Object.keys(
                            PANELS
                        ).forEach(
                            panel => {

                                const matching =
                                    records
                                        .filter(
                                            record =>
                                                record.inspectionId ===
                                                    inspectionId &&
                                                record.panel ===
                                                    panel
                                        )
                                        .sort(
                                            (a, b) =>
                                                new Date(
                                                    b.createdAt
                                                ) -
                                                new Date(
                                                    a.createdAt
                                                )
                                        );


                                metadata[panel] =
                                    matching[0]
                                        ? {
                                            name:
                                                matching[0].name,

                                            type:
                                                matching[0].type,

                                            createdAt:
                                                matching[0].createdAt
                                        }
                                        : null;
                            }
                        );


                        db.close();


                        resolve(
                            metadata
                        );
                    };


                request.onerror =
                    () => {

                        db.close();

                        reject(
                            request.error
                        );
                    };
            }
        );
    }


    /* =====================================================
       SUCCESS MESSAGE
    ===================================================== */

    function showSuccess(message) {

        const existing =
            document.getElementById(
                "scannerSuccessMessage"
            );


        if (existing) {
            existing.remove();
        }


        const messageBox =
            document.createElement(
                "div"
            );


        messageBox.id =
            "scannerSuccessMessage";


        messageBox.style.cssText = `
            margin:12px 0;
            padding:11px 14px;
            border-radius:8px;
            background:#edf9f2;
            border:1px solid #ccebd8;
            color:#187348;
            font-size:13px;
            font-weight:700;
        `;


        messageBox.textContent =
            message;


        cameraContainer.after(
            messageBox
        );


        setTimeout(
            () => {

                if (
                    messageBox.parentElement
                ) {

                    messageBox.remove();
                }

            },
            3000
        );
    }


    /* =====================================================
       CLEANUP
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        () => {

            stopCameraTracks();


            if (currentPreviewUrl) {

                URL.revokeObjectURL(
                    currentPreviewUrl
                );

                currentPreviewUrl =
                    null;
            }
        }
    );


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    updatePanelButtons();

    updateCaptureButton();

    updateUploadLabel();

    loadExistingPanelPreview();


    console.log(
        "=========================================="
    );

    console.log(
        "e-PARAKH SCANNER READY"
    );

    console.log(
        "Inspection ID:",
        inspectionId
    );

    console.log(
        "Current Panel:",
        currentPanel
    );

    console.log(
        "IndexedDB:",
        `${DB_NAME} v${DB_VERSION}`
    );

    console.log(
        "Compliance calculation:",
        "NOT TOUCHED"
    );

    console.log(
        "=========================================="
    );
});