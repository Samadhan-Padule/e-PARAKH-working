```javascript
/* =========================================================
   e-PARAKH
   PRODUCT SCANNER
   Multi-Panel Camera + Image Upload
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const cameraArea = document.getElementById("cameraArea");
    const startCameraBtn = document.getElementById("startCameraBtn");

    const productImage = document.getElementById("productImage");
    const previewArea = document.getElementById("previewArea");
    const imagePreview = document.getElementById("imagePreview");
    const fileName = document.getElementById("fileName");

    const removeImageBtn = document.getElementById("removeImageBtn");
    const continueBtn = document.getElementById("continueBtn");

    const logoutBtn = document.getElementById("logoutBtn");
    const inspectionCount = document.getElementById("inspectionCount");

    let cameraStream = null;
    let selectedImage = null;

    /* =====================================================
       MULTI-PANEL STATE
       ===================================================== */

    let currentPanel = "FRONT";

    const panelImages = {
        FRONT: null,
        BACK: null,
        SIDE: null,
        TOP: null,
        BOTTOM: null,
        MRP_PANEL: null,
        OTHER: null
    };

    /* =====================================================
       INDEXED DB
       ===================================================== */

    const DB_NAME = "eParakhScannerDB";
    const DB_VERSION = 1;
    const STORE_NAME = "panelImages";

    function openPanelDB() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onupgradeneeded = (event) => {

                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {

                    db.createObjectStore(
                        STORE_NAME,
                        { keyPath: "panel" }
                    );

                }

            };

            request.onsuccess = () => {

                resolve(request.result);

            };

            request.onerror = () => {

                reject(request.error);

            };

        });

    }


    async function savePanelImage(panel, file) {

        const reader = new FileReader();

        const dataUrl = await new Promise(
            (resolve, reject) => {

                reader.onload = () =>
                    resolve(reader.result);

                reader.onerror = () =>
                    reject(reader.error);

                reader.readAsDataURL(file);

            }
        );

        const db = await openPanelDB();

        return new Promise((resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            store.put({
                panel: panel,
                name: file.name,
                type: file.type,
                dataUrl: dataUrl,
                savedAt: new Date().toISOString()
            });

            transaction.oncomplete = () => {

                db.close();

                resolve();

            };

            transaction.onerror = () => {

                db.close();

                reject(transaction.error);

            };

        });

    }


    async function clearPanelImages() {

        try {

            const db = await openPanelDB();

            await new Promise((resolve, reject) => {

                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readwrite"
                    );

                transaction
                    .objectStore(STORE_NAME)
                    .clear();

                transaction.oncomplete =
                    resolve;

                transaction.onerror =
                    () => reject(
                        transaction.error
                    );

            });

            db.close();

        } catch (error) {

            console.warn(
                "Unable to clear panel database:",
                error
            );

        }

    }


    /* =====================================================
       PANEL SELECTOR
       ===================================================== */

    function createPanelSelector() {

        const existing =
            document.getElementById(
                "panelSelector"
            );

        if (existing) return;

        const selector =
            document.createElement("div");

        selector.id = "panelSelector";

        selector.style.cssText = `
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            margin:15px 0;
        `;

        const panels = [
            ["FRONT", "Front"],
            ["BACK", "Back"],
            ["SIDE", "Side"],
            ["TOP", "Top"],
            ["BOTTOM", "Bottom"],
            ["MRP_PANEL", "MRP"],
            ["OTHER", "Other"]
        ];

        panels.forEach(([value, label]) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent = label;

            button.dataset.panel = value;

            button.style.cssText = `
                padding:8px 12px;
                border:1px solid #d1d5db;
                border-radius:8px;
                background:#fff;
                cursor:pointer;
                font-weight:600;
                font-size:13px;
            `;

            button.addEventListener(
                "click",
                () => {

                    currentPanel = value;

                    document
                        .querySelectorAll(
                            "#panelSelector button"
                        )
                        .forEach(btn => {

                            btn.style.fontWeight =
                                btn.dataset.panel === value
                                    ? "800"
                                    : "600";

                        });

                    updatePanelStatus();

                }
            );

            selector.appendChild(button);

        });

        const target =
            cameraArea?.parentElement ||
            document.body;

        target.insertBefore(
            selector,
            cameraArea
        );

    }


    function updatePanelStatus() {

        const existing =
            document.getElementById(
                "panelStatus"
            );

        if (existing) {

            existing.textContent =
                `Current panel: ${currentPanel}`;

        }

    }


    function createPanelStatus() {

        const status =
            document.createElement("div");

        status.id = "panelStatus";

        status.style.cssText = `
            margin:8px 0;
            font-size:13px;
            font-weight:700;
        `;

        status.textContent =
            `Current panel: ${currentPanel}`;

        const selector =
            document.getElementById(
                "panelSelector"
            );

        if (selector) {

            selector.after(status);

        }

    }


    createPanelSelector();
    createPanelStatus();


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
                await navigator.mediaDevices.getUserMedia({
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
                "Camera Error:",
                error
            );

            if (
                error.name ===
                "NotAllowedError"
            ) {

                showCameraError(
                    "Camera permission was denied. Please allow camera access in your browser."
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
                    "Unable to access the camera. Please check your browser permissions."
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
            document.createElement("video");

        video.id =
            "cameraVideo";

        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;

        video.srcObject =
            cameraStream;

        cameraArea.appendChild(
            video
        );


        const guide =
            document.createElement("div");

        guide.style.cssText = `
            position:absolute;
            inset:12%;
            border:2px dashed rgba(255,255,255,.8);
            border-radius:12px;
            pointer-events:none;
        `;

        cameraArea.appendChild(
            guide
        );


        const controls =
            document.createElement("div");

        controls.className =
            "camera-controls";


        const captureBtn =
            document.createElement("button");

        captureBtn.type = "button";

        captureBtn.className =
            "capture-btn";

        captureBtn.innerHTML = `
            <span class="capture-circle"></span>
            Capture ${currentPanel}
        `;


        const stopBtn =
            document.createElement("button");

        stopBtn.type = "button";

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
       CAPTURE IMAGE
       ===================================================== */

    function captureImage(video) {

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;

        const context =
            canvas.getContext(
                "2d"
            );

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        canvas.toBlob(
            async (blob) => {

                if (!blob) {

                    alert(
                        "Unable to capture image."
                    );

                    return;

                }

                selectedImage =
                    new File(
                        [blob],
                        `${currentPanel}-panel.jpg`,
                        {
                            type:
                                "image/jpeg"
                        }
                    );

                panelImages[currentPanel] =
                    selectedImage;

                await savePanelImage(
                    currentPanel,
                    selectedImage
                );

                showSelectedImage(
                    selectedImage
                );

                stopCamera();

                showSuccess(
                    `${currentPanel} panel captured successfully.`
                );

            },
            "image/jpeg",
            0.92
        );

    }


    /* =====================================================
       SHOW SELECTED IMAGE
       ===================================================== */

    function showSelectedImage(file) {

        const imageUrl =
            URL.createObjectURL(file);

        imagePreview.src =
            imageUrl;

        fileName.textContent =
            `${currentPanel}: ${file.name}`;

        previewArea.hidden =
            false;

        continueBtn.disabled =
            false;

    }


    /* =====================================================
       STOP CAMERA
       ===================================================== */

    function stopCamera() {

        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

            cameraStream = null;

        }

        cameraArea.classList.remove(
            "camera-active"
        );

        restoreCameraPlaceholder();

    }


    /* =====================================================
       RESTORE CAMERA
       ===================================================== */

    function restoreCameraPlaceholder() {

        cameraArea.innerHTML = `

            <div class="camera-placeholder">

                <div class="camera-icon">
                    📷
                </div>

                <h3>
                    Ready to Scan
                </h3>

                <p>
                    Select a panel and capture
                    the packaged commodity label.
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

        const file =
            event.target.files[0];

        if (!file) return;


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

            productImage.value = "";

            return;

        }


        const maxSize =
            10 * 1024 * 1024;


        if (file.size > maxSize) {

            alert(
                "Image size must be less than 10 MB."
            );

            productImage.value = "";

            return;

        }


        selectedImage =
            file;

        panelImages[currentPanel] =
            file;


        try {

            await savePanelImage(
                currentPanel,
                file
            );

        } catch (error) {

            console.error(
                "Panel save error:",
                error
            );

        }


        showSelectedImage(file);

    }


    /* =====================================================
       REMOVE IMAGE
       ===================================================== */

    if (removeImageBtn) {

        removeImageBtn.addEventListener(
            "click",
            async () => {

                selectedImage =
                    null;

                panelImages[currentPanel] =
                    null;

                productImage.value =
                    "";

                imagePreview.src =
                    "";

                fileName.textContent =
                    "-";

                previewArea.hidden =
                    true;

                continueBtn.disabled =
                    true;

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

                            transaction
                                .objectStore(
                                    STORE_NAME
                                )
                                .delete(
                                    currentPanel
                                );

                            transaction.oncomplete =
                                resolve;

                            transaction.onerror =
                                () =>
                                    reject(
                                        transaction.error
                                    );

                        }
                    );

                    db.close();

                } catch (error) {

                    console.warn(
                        "Unable to remove panel image:",
                        error
                    );

                }

            }
        );

    }


    /* =====================================================
       ANALYZE PRODUCT
       ===================================================== */

    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            analyzeProduct
        );

    }


    async function analyzeProduct() {

        if (!panelImages.FRONT) {

            alert(
                "Please scan or upload the FRONT panel image first."
            );

            return;

        }


        continueBtn.disabled =
            true;

        const originalText =
            continueBtn.innerHTML;

        continueBtn.innerHTML = `
            <span>Preparing Inspection...</span>
            <span class="loading-spinner"></span>
        `;


        try {

            /* =============================================
               SAVE FRONT IMAGE FOR BACKWARD COMPATIBILITY
               ============================================= */

            const reader =
                new FileReader();

            reader.onload = () => {

                sessionStorage.setItem(
                    "eParakhCapturedImage",
                    reader.result
                );

                localStorage.setItem(
                    "scannedProductImage",
                    reader.result
                );

            };

            reader.readAsDataURL(
                panelImages.FRONT
            );


            /* =============================================
               SAVE PANEL METADATA
               ============================================= */

            const panelMetadata = {};

            Object.keys(panelImages)
                .forEach(panel => {

                    panelMetadata[panel] =
                        panelImages[panel]
                            ? panelImages[panel].name
                            : null;

                });


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


            /*
             * IMPORTANT:
             * We do NOT call /analyze here.
             *
             * inspection.js will perform the
             * multi-image OCR analysis.
             */


            window.location.href =
                "pages/inspection.html";

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
                originalText;

        }

    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            () => {

                sessionStorage.clear();

                clearPanelImages();

                window.location.href =
                    "pages/login.html";

            }
        );

    }


    /* =====================================================
       CAMERA ERROR
       ===================================================== */

    function showCameraError(message) {

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

        cameraArea.parentElement.insertBefore(
            messageBox,
            cameraArea.nextSibling
        );


        setTimeout(() => {

            if (
                messageBox.parentElement
            ) {

                messageBox.remove();

            }

        }, 3000);

    }


    /* =====================================================
       INITIAL COUNTER
       ===================================================== */

    if (inspectionCount) {

        const count =
            sessionStorage.getItem(
                "inspectionCount"
            ) || "0";

        inspectionCount.textContent =
            count;

    }

});
```
