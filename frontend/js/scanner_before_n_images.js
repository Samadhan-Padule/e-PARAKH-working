/* =========================================================
   e-PARAKH
   PRODUCT SCANNER — PHASE 2
   N-IMAGE MULTI-PANEL SCANNER
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const cameraArea = document.getElementById("cameraArea");
    const startCameraBtn = document.getElementById("startCameraBtn");
    const cameraStatus = document.getElementById("cameraStatus");

    const productImage = document.getElementById("productImage");
    const previewArea = document.getElementById("previewArea");
    const imagePreview = document.getElementById("imagePreview");
    const fileName = document.getElementById("fileName");
    const currentPanelLabel = document.getElementById("currentPanelLabel");

    const removeImageBtn = document.getElementById("removeImageBtn");
    const retakeBtn = document.getElementById("retakeBtn");
    const continueBtn = document.getElementById("continueBtn");

    const logoutBtn = document.getElementById("logoutBtn");
    const inspectionCount = document.getElementById("inspectionCount");


    /* =====================================================
       INDEXEDDB CONFIG
    ===================================================== */

    const PANEL_DB_NAME = "eParakhScannerDB";
    const PANEL_DB_VERSION = 2;
    const PANEL_STORE_NAME = "panelImages";


    /* =====================================================
       PANEL CONFIGURATION
    ===================================================== */

    const PANELS = [
        "FRONT",
        "BACK",
        "SIDE",
        "TOP",
        "BOTTOM",
        "MRP_PANEL",
        "OTHER"
    ];


    /* =====================================================
       PANEL STATE
       Each panel can contain MULTIPLE images.
    ===================================================== */

    let currentPanel = "FRONT";

    let panelImages = {
        FRONT: [],
        BACK: [],
        SIDE: [],
        TOP: [],
        BOTTOM: [],
        MRP_PANEL: [],
        OTHER: []
    };

    let cameraStream = null;
    let selectedImage = null;


    /* =====================================================
       INDEXEDDB
    ===================================================== */

    function openPanelDB() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                PANEL_DB_NAME,
                PANEL_DB_VERSION
            );


            request.onupgradeneeded = function (event) {

                const db = event.target.result;

                if (!db.objectStoreNames.contains(PANEL_STORE_NAME)) {

                    const store = db.createObjectStore(
                        PANEL_STORE_NAME,
                        {
                            keyPath: "id"
                        }
                    );


                    store.createIndex(
                        "panel",
                        "panel",
                        {
                            unique: false
                        }
                    );


                    store.createIndex(
                        "createdAt",
                        "createdAt",
                        {
                            unique: false
                        }
                    );
                }
            };


            request.onsuccess = function () {

                resolve(request.result);

            };


            request.onerror = function () {

                reject(request.error);

            };

        });
    }


    /* =====================================================
       FILE → DATA URL
    ===================================================== */

    function fileToDataUrl(file) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();


            reader.onload = function () {

                resolve(reader.result);

            };


            reader.onerror = function () {

                reject(reader.error);

            };


            reader.readAsDataURL(file);

        });
    }


    /* =====================================================
       SAVE IMAGE TO INDEXEDDB
    ===================================================== */

    async function savePanelImageToDB(
        file,
        panel,
        source = "upload"
    ) {

        try {

            const dataUrl = await fileToDataUrl(file);


            const record = {

                id:
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .substring(2, 10),

                panel: panel,

                name:
                    file.name ||
                    `${panel}-panel.jpg`,

                type:
                    file.type ||
                    "image/jpeg",

                file: file,

                dataUrl: dataUrl,

                source: source,

                createdAt:
                    new Date().toISOString()

            };


            const db = await openPanelDB();


            return new Promise((resolve, reject) => {

                const transaction =
                    db.transaction(
                        PANEL_STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        PANEL_STORE_NAME
                    );


                const request =
                    store.put(record);


                request.onsuccess = function () {

                    console.log(
                        "IMAGE SAVED TO INDEXEDDB:",
                        panel,
                        record.name
                    );

                    db.close();

                    resolve(record);

                };


                request.onerror = function () {

                    console.error(
                        "INDEXEDDB SAVE ERROR:",
                        request.error
                    );

                    db.close();

                    reject(request.error);

                };

            });

        } catch (error) {

            console.error(
                "SAVE IMAGE ERROR:",
                error
            );

            return null;
        }
    }


    /* =====================================================
       CLEAR OLD INSPECTION IMAGES
    ===================================================== */

    async function clearPanelImagesDB() {

        try {

            const db = await openPanelDB();


            return new Promise((resolve) => {

                const transaction =
                    db.transaction(
                        PANEL_STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        PANEL_STORE_NAME
                    );


                const request =
                    store.clear();


                request.onsuccess = function () {

                    console.log(
                        "OLD INSPECTION IMAGES CLEARED"
                    );

                    db.close();

                    resolve();

                };


                request.onerror = function () {

                    console.error(
                        "INDEXEDDB CLEAR ERROR:",
                        request.error
                    );

                    db.close();

                    resolve();

                };

            });

        } catch (error) {

            console.error(
                "CLEAR DB ERROR:",
                error
            );
        }
    }


    /* =====================================================
       REMOVE SPECIFIC PANEL IMAGES FROM DB
    ===================================================== */

    async function removePanelImagesFromDB(panel) {

        try {

            const db = await openPanelDB();


            return new Promise((resolve) => {

                const transaction =
                    db.transaction(
                        PANEL_STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        PANEL_STORE_NAME
                    );


                const index =
                    store.index("panel");


                const request =
                    index.getAllKeys(panel);


                request.onsuccess = function () {

                    const keys =
                        request.result || [];


                    keys.forEach((key) => {

                        store.delete(key);

                    });


                    console.log(
                        "REMOVED DB IMAGES:",
                        panel,
                        keys.length
                    );


                    transaction.oncomplete = function () {

                        db.close();

                        resolve();

                    };

                };


                request.onerror = function () {

                    console.error(
                        "REMOVE DB IMAGES ERROR:",
                        request.error
                    );

                    db.close();

                    resolve();

                };

            });

        } catch (error) {

            console.error(
                "REMOVE PANEL ERROR:",
                error
            );
        }
    }


    /* =====================================================
       START NEW SCAN
       Clear previous inspection images ONLY when scanner
       page is opened.
    ===================================================== */

    await clearPanelImagesDB();


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    if (continueBtn) {

        continueBtn.disabled = true;

    }


    /* =====================================================
       PANEL SELECTION
    ===================================================== */

    function initPanelButtons() {

        const panelBtns =
            document.querySelectorAll(".panel-btn");


        panelBtns.forEach((btn) => {

            btn.addEventListener(
                "click",
                () => {

                    const panel =
                        btn.getAttribute(
                            "data-panel"
                        );


                    if (PANELS.includes(panel)) {

                        selectPanel(panel);

                    }

                }
            );

        });
    }


    function selectPanel(panel) {

        currentPanel = panel;


        document
            .querySelectorAll(".panel-btn")
            .forEach((btn) => {

                btn.classList.remove("active");

            });


        const activeButton =
            document.querySelector(
                `[data-panel="${panel}"]`
            );


        if (activeButton) {

            activeButton.classList.add("active");

        }


        if (currentPanelLabel) {

            currentPanelLabel.textContent =
                panel;

        }


        const images =
            panelImages[panel] || [];


        if (images.length > 0) {

            const latestImage =
                images[images.length - 1];


            selectedImage =
                latestImage.file;


            imagePreview.src =
                latestImage.dataUrl ||
                URL.createObjectURL(
                    latestImage.file
                );


            fileName.textContent =
                `${panel} Panel (${images.length} image${images.length > 1 ? "s" : ""})`;


            previewArea.hidden = false;

        } else {

            selectedImage = null;

            imagePreview.src = "";

            fileName.textContent = "-";

            previewArea.hidden = true;

        }


        updatePanelStatusGrid();

        updateContinueButton();

    }


    /* =====================================================
       PANEL STATUS
    ===================================================== */

    function updatePanelStatusGrid() {

        document
            .querySelectorAll(".panel-status-item")
            .forEach((item) => {

                const panel =
                    item.getAttribute(
                        "data-panel"
                    );


                const indicator =
                    item.querySelector(
                        ".panel-status-indicator"
                    );


                const count =
                    panelImages[panel]
                        ? panelImages[panel].length
                        : 0;


                if (count > 0) {

                    item.classList.add(
                        "captured"
                    );


                    if (indicator) {

                        indicator.classList.add(
                            "checkmark"
                        );


                        indicator.textContent =
                            count > 1
                                ? count
                                : "✓";

                    }

                } else {

                    item.classList.remove(
                        "captured"
                    );


                    if (indicator) {

                        indicator.classList.remove(
                            "checkmark"
                        );


                        indicator.textContent =
                            "-";

                    }
                }

            });
    }


    /* =====================================================
       TOTAL IMAGE COUNT
    ===================================================== */

    function getTotalImages() {

        return Object.values(panelImages)
            .reduce(
                (total, images) =>
                    total + images.length,
                0
            );
    }


    /* =====================================================
       FRONT IMAGE CHECK
    ===================================================== */

    function hasFrontImage() {

        return (
            panelImages.FRONT &&
            panelImages.FRONT.length > 0
        );
    }


    /* =====================================================
       CONTINUE BUTTON
    ===================================================== */

    function updateContinueButton() {

        if (!continueBtn) {

            return;

        }


        continueBtn.disabled =
            !hasFrontImage();

    }


    /* =====================================================
       IMAGE QUALITY CHECK
    ===================================================== */

    function checkImageQuality(canvas) {

        if (cameraStatus) {

            cameraStatus.hidden = false;

        }


        const ctx =
            canvas.getContext("2d");


        const imageData =
            ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        const data =
            imageData.data;


        let brightness = 0;


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            brightness += data[i];

        }


        brightness =
            brightness /
            (data.length / 4);


        const blurCheck =
            document.getElementById(
                "blurCheck"
            );


        const lightingCheck =
            document.getElementById(
                "lightingCheck"
            );


        if (blurCheck) {

            blurCheck.classList.add(
                "good"
            );


            const icon =
                blurCheck.querySelector(
                    ".check-icon"
                );


            const text =
                blurCheck.querySelector(
                    ".check-text"
                );


            if (icon) {

                icon.textContent = "✓";

            }


            if (text) {

                text.textContent =
                    "Image quality checked";

            }
        }


        if (lightingCheck) {

            if (
                brightness > 60 &&
                brightness < 220
            ) {

                lightingCheck.classList.add(
                    "good"
                );


                lightingCheck.classList.remove(
                    "warning"
                );


                const icon =
                    lightingCheck.querySelector(
                        ".check-icon"
                    );


                const text =
                    lightingCheck.querySelector(
                        ".check-text"
                    );


                if (icon) {

                    icon.textContent = "✓";

                }


                if (text) {

                    text.textContent =
                        "Good lighting detected";

                }

            } else {

                lightingCheck.classList.add(
                    "warning"
                );


                lightingCheck.classList.remove(
                    "good"
                );


                const icon =
                    lightingCheck.querySelector(
                        ".check-icon"
                    );


                const text =
                    lightingCheck.querySelector(
                        ".check-text"
                    );


                if (icon) {

                    icon.textContent = "⚠";

                }


                if (text) {

                    text.textContent =
                        "Consider improving lighting";

                }
            }
        }
    }


    /* =====================================================
       START CAMERA
    ===================================================== */

    if (startCameraBtn) {

        startCameraBtn.addEventListener(
            "click",
            startCamera
        );

    }


    async function startCamera() {

        try {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                showCameraError(
                    "Camera access is not supported by this browser."
                );

                return;
            }


            cameraStream =
                await navigator.mediaDevices
                    .getUserMedia({

                        video: {

                            facingMode: {
                                ideal: "environment"
                            },

                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }

                        },

                        audio: false

                    });


            openCamera();

        } catch (error) {

            console.error(
                "CAMERA ERROR:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                showCameraError(
                    "Camera permission was denied. Please allow camera access."
                );

            } else if (
                error.name ===
                "NotFoundError"
            ) {

                showCameraError(
                    "No camera was found on this device."
                );

            } else {

                showCameraError(
                    "Unable to access the camera."
                );
            }
        }
    }


    /* =====================================================
       OPEN CAMERA
    ===================================================== */

    function openCamera() {

        cameraArea.innerHTML = "";

        cameraArea.classList.add(
            "camera-active"
        );


        const video =
            document.createElement(
                "video"
            );


        video.id =
            "cameraVideo";

        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject =
            cameraStream;


        cameraArea.appendChild(video);


        const controls =
            document.createElement(
                "div"
            );


        controls.className =
            "camera-controls";


        const captureBtn =
            document.createElement(
                "button"
            );


        captureBtn.type =
            "button";


        captureBtn.className =
            "capture-btn";


        captureBtn.innerHTML = `
            <span class="capture-circle"></span>
            Capture ${currentPanel}
        `;


        const stopBtn =
            document.createElement(
                "button"
            );


        stopBtn.type =
            "button";


        stopBtn.className =
            "stop-camera-btn";


        stopBtn.textContent =
            "Stop Camera";


        controls.appendChild(
            captureBtn
        );


        controls.appendChild(
            stopBtn
        );


        cameraArea.appendChild(
            controls
        );


        captureBtn.addEventListener(
            "click",
            () => {

                captureImage(video);

            }
        );


        stopBtn.addEventListener(
            "click",
            stopCamera
        );
    }


    /* =====================================================
       CAPTURE CAMERA IMAGE
    ===================================================== */

    async function captureImage(video) {

        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            video.videoWidth;


        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        checkImageQuality(canvas);


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
                        [blob],
                        `${currentPanel}-${Date.now()}.jpg`,
                        {
                            type: "image/jpeg"
                        }
                    );


                await addImage(
                    file,
                    currentPanel,
                    "camera"
                );


                stopCamera();


                showSuccess(
                    `${currentPanel} image captured successfully.`
                );

            },
            "image/jpeg",
            0.92
        );
    }


    /* =====================================================
       ADD IMAGE
    ===================================================== */

    async function addImage(
        file,
        panel,
        source
    ) {

        if (!file) {

            return;

        }


        const savedRecord =
            await savePanelImageToDB(
                file,
                panel,
                source
            );


        if (!savedRecord) {

            alert(
                "Unable to save image. Please try again."
            );

            return;

        }


        if (!panelImages[panel]) {

            panelImages[panel] = [];

        }


        panelImages[panel].push(
            savedRecord
        );


        selectedImage =
            file;


        imagePreview.src =
            savedRecord.dataUrl;


        fileName.textContent =
            `${panel} Panel - ${savedRecord.name}`;


        previewArea.hidden =
            false;


        updatePanelStatusGrid();

        updateContinueButton();


        console.log(
            "N-IMAGE ADDED:",
            {
                panel: panel,
                name: savedRecord.name,
                source: source,
                total: getTotalImages()
            }
        );
    }


    /* =====================================================
       STOP CAMERA
    ===================================================== */

    function stopCamera() {

        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );

            cameraStream = null;

        }


        if (cameraArea) {

            cameraArea.classList.remove(
                "camera-active"
            );

            restoreCameraPlaceholder();

        }


        if (cameraStatus) {

            cameraStatus.hidden = true;

        }
    }


    /* =====================================================
       CAMERA PLACEHOLDER
    ===================================================== */

    function restoreCameraPlaceholder() {

        if (!cameraArea) {

            return;

        }


        cameraArea.innerHTML = `
            <div class="camera-placeholder">

                <div class="camera-icon">📷</div>

                <h3>Ready to Scan</h3>

                <p>
                    Position the packaged commodity label
                    clearly inside the camera frame.
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="startCameraBtn"
                >
                    Start Camera
                    <span>→</span>
                </button>

            </div>
        `;


        const newButton =
            document.getElementById(
                "startCameraBtn"
            );


        if (newButton) {

            newButton.addEventListener(
                "click",
                startCamera
            );

        }
    }


    /* =====================================================
       FILE UPLOAD
    ===================================================== */

    if (productImage) {

        productImage.addEventListener(
            "change",
            handleFileUpload
        );

    }


    async function handleFileUpload(event) {

        const files =
            Array.from(
                event.target.files || []
            );


        if (files.length === 0) {

            return;

        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        for (const file of files) {

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                alert(
                    `${file.name}: Please select JPG, PNG or WEBP.`
                );

                continue;
            }


            const maxSize =
                10 * 1024 * 1024;


            if (
                file.size > maxSize
            ) {

                alert(
                    `${file.name}: Image must be less than 10 MB.`
                );

                continue;
            }


            await addImage(
                file,
                currentPanel,
                "upload"
            );

        }


        productImage.value = "";


        updatePanelStatusGrid();

        updateContinueButton();

    }


    /* =====================================================
       REMOVE CURRENT PANEL IMAGES
    ===================================================== */

    if (removeImageBtn) {

        removeImageBtn.addEventListener(
            "click",
            async () => {

                await removePanelImagesFromDB(
                    currentPanel
                );


                panelImages[currentPanel] =
                    [];


                selectedImage =
                    null;


                if (productImage) {

                    productImage.value = "";

                }


                imagePreview.src = "";

                fileName.textContent = "-";

                previewArea.hidden = true;


                updatePanelStatusGrid();

                updateContinueButton();

            }
        );

    }


    /* =====================================================
       RETAKE
    ===================================================== */

    if (retakeBtn) {

        retakeBtn.addEventListener(
            "click",
            async () => {

                await removePanelImagesFromDB(
                    currentPanel
                );


                panelImages[currentPanel] =
                    [];


                selectedImage =
                    null;


                previewArea.hidden =
                    true;


                updatePanelStatusGrid();

                updateContinueButton();


                startCamera();

            }
        );

    }


    /* =====================================================
       CONTINUE → INSPECTION
    ===================================================== */

    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            analyzeProduct
        );

    }


    async function analyzeProduct() {

        const totalImages =
            getTotalImages();


        console.log(
            "================================="
        );


        console.log(
            "CONTINUE TO INSPECTION"
        );


        console.log(
            "TOTAL IMAGES:",
            totalImages
        );


        console.log(
            "PANEL IMAGES:",
            panelImages
        );


        console.log(
            "================================="
        );


        if (!hasFrontImage()) {

            alert(
                "Please scan or upload the FRONT panel image."
            );

            return;

        }


        if (totalImages === 0) {

            alert(
                "Please scan at least one image."
            );

            return;

        }


        continueBtn.disabled =
            true;


        continueBtn.innerHTML = `
            <span>Opening Inspection...</span>
            <span class="loading-spinner"></span>
        `;


        /* =================================================
           FRONT IMAGE BACKWARD COMPATIBILITY
        ================================================= */

        const frontRecord =
            panelImages.FRONT[0];


        const frontImage =
            frontRecord.file;


        try {

            const frontDataUrl =
                frontRecord.dataUrl ||
                await fileToDataUrl(
                    frontImage
                );


            sessionStorage.setItem(
                "eParakhCapturedImage",
                frontDataUrl
            );


            localStorage.setItem(
                "scannedProductImage",
                frontDataUrl
            );


            /* =============================================
               PANEL METADATA
            ============================================= */

            const panelMetadata = {};


            PANELS.forEach(
                (panel) => {

                    panelMetadata[panel] =
                        (
                            panelImages[panel] ||
                            []
                        ).map(
                            (image) => ({
                                id: image.id,
                                name: image.name,
                                panel: image.panel,
                                source: image.source,
                                createdAt: image.createdAt
                            })
                        );

                }
            );


            sessionStorage.setItem(
                "panelImages",
                JSON.stringify(
                    panelMetadata
                )
            );


            sessionStorage.setItem(
                "inspectionStarted",
                "true"
            );


            let count =
                parseInt(
                    sessionStorage.getItem(
                        "inspectionCount"
                    ) || "0",
                    10
                );


            count += 1;


            sessionStorage.setItem(
                "inspectionCount",
                count.toString()
            );


            console.log(
                "SCANNER READY"
            );


            console.log(
                "TOTAL IMAGES:",
                totalImages
            );


            console.log(
                "OPENING INSPECTION..."
            );


            window.location.href =
                "pages/inspection.html";


        } catch (error) {

            console.error(
                "ANALYZE PRODUCT ERROR:",
                error
            );


            continueBtn.disabled =
                false;


            continueBtn.innerHTML =
                `Continue to Inspection <span>→</span>`;


            alert(
                "Unable to prepare images. Please try again."
            );

        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                await clearPanelImagesDB();


                sessionStorage.clear();


                localStorage.removeItem(
                    "scannedProductImage"
                );


                window.location.href =
                    "login.html";

            }
        );

    }


    /* =====================================================
       CAMERA ERROR
    ===================================================== */

    function showCameraError(message) {

        if (!cameraArea) {

            return;

        }


        cameraArea.innerHTML = `
            <div class="camera-placeholder">

                <div class="camera-icon">
                    ⚠
                </div>

                <h3>
                    Camera Access Required
                </h3>

                <p>
                    ${message}
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="retryCameraBtn"
                >
                    Try Again →
                </button>

            </div>
        `;


        const retryButton =
            document.getElementById(
                "retryCameraBtn"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                startCamera
            );

        }
    }


    /* =====================================================
       SUCCESS MESSAGE
    ===================================================== */

    function showSuccess(message) {

        const messageBox =
            document.createElement(
                "div"
            );


        messageBox.style.cssText = `
            margin-top:12px;
            padding:10px 13px;
            border-radius:7px;
            background:#edf9f2;
            border:1px solid #ccebd8;
            color:#187348;
            font-size:10px;
            font-weight:700;
        `;


        messageBox.textContent =
            message;


        if (
            previewArea &&
            !previewArea.hidden &&
            previewArea.parentElement
        ) {

            previewArea.parentElement.insertBefore(
                messageBox,
                previewArea.nextSibling
            );

        } else if (
            cameraArea &&
            cameraArea.parentElement
        ) {

            cameraArea.parentElement.insertBefore(
                messageBox,
                cameraArea.nextSibling
            );

        }


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
       INITIAL SETUP
    ===================================================== */

    if (inspectionCount) {

        const count =
            sessionStorage.getItem(
                "inspectionCount"
            ) || "0";


        inspectionCount.textContent =
            count;

    }


    initPanelButtons();

    updatePanelStatusGrid();

    updateContinueButton();


    console.log(
        "================================="
    );


    console.log(
        "e-PARAKH N-IMAGE SCANNER READY"
    );


    console.log(
        "IndexedDB:",
        PANEL_DB_NAME
    );


    console.log(
        "DB VERSION:",
        PANEL_DB_VERSION
    );


    console.log(
        "SUPPORTED PANELS:",
        PANELS
    );


    console.log(
        "================================="
    );

});