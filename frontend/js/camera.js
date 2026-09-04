// ==========================================
// e-PARAKH - Multi Evidence Camera Module
// Minimum 1 / Maximum 4 Images
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const video =
        document.getElementById("cameraPreview");

    const placeholder =
        document.getElementById("cameraPlaceholder");

    const overlay =
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

    const browsePhotoBtn =
        document.getElementById("browsePhotoBtn");

    const photoInput =
        document.getElementById("photoInput");

    const currentEvidenceLabel =
        document.getElementById("currentEvidenceLabel");

    const scanPositionLabel =
        document.getElementById("scanPositionLabel");

    const cameraStatus =
        document.getElementById("cameraStatus");

    const evidenceCount =
        document.getElementById("evidenceCount");

    const continueBtn =
        document.getElementById("continueBtn");

    const continueHint =
        document.getElementById("continueHint");

    const capturePreviewContainer =
        document.getElementById("capturePreviewContainer");

    const capturedImage =
        document.getElementById("capturedImage");

    const retakeBtn =
        document.getElementById("retakeBtn");

    const saveEvidenceBtn =
        document.getElementById("saveEvidenceBtn");


    // ==========================================
    // EVIDENCE CONFIG
    // ==========================================

    const evidenceTypes = [
        "front",
        "back",
        "side",
        "batch"
    ];

    const evidenceLabels = {
        front: "Front",
        back: "Back",
        side: "Side",
        batch: "Batch / MRP"
    };

    const MAX_EVIDENCE = 4;
    const MIN_EVIDENCE = 1;


    // ==========================================
    // STATE
    // ==========================================

    let stream = null;

    let facingMode = "environment";

    let currentEvidence = "front";

    let pendingImage = null;

    let evidencePhotos = {
        front: null,
        back: null,
        side: null,
        batch: null
    };


    // ==========================================
    // INDEXED DB
    // ==========================================

    const DB_NAME =
        "eParakhEvidenceDB";

    const DB_VERSION = 1;

    const STORE_NAME =
        "inspectionEvidence";

    let db = null;


    // ==========================================
    // OPEN DATABASE
    // ==========================================

    function openDatabase() {

        return new Promise(
            (resolve, reject) => {

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


                request.onupgradeneeded =
                    (event) => {

                        const database =
                            event.target.result;


                        if (
                            !database.objectStoreNames.contains(
                                STORE_NAME
                            )
                        ) {

                            database.createObjectStore(
                                STORE_NAME
                            );

                        }

                    };


                request.onsuccess = () => {

                    db =
                        request.result;


                    /*
                     * If the database connection is closed
                     * unexpectedly, reset the reference.
                     */
                    db.onclose = () => {
                        db = null;
                    };


                    resolve(db);

                };


                request.onerror = () => {

                    reject(
                        request.error ||
                        new Error(
                            "Unable to open evidence database."
                        )
                    );

                };


                request.onblocked = () => {

                    reject(
                        new Error(
                            "Evidence database request was blocked."
                        )
                    );

                };

            }
        );
    }


    // ==========================================
    // SAVE EVIDENCE TO DB
    // ==========================================

    function saveEvidenceToDB(
        type,
        imageData
    ) {

        return new Promise(
            (resolve, reject) => {

                if (!db) {

                    reject(
                        new Error(
                            "Database is not ready."
                        )
                    );

                    return;
                }


                if (
                    !evidenceTypes.includes(type)
                ) {

                    reject(
                        new Error(
                            "Invalid evidence type."
                        )
                    );

                    return;
                }


                const transaction =
                    db.transaction(
                        STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                store.put(
                    imageData,
                    type
                );


                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "Unable to save evidence."
                            )
                        );

                    };

            }
        );
    }


    // ==========================================
    // LOAD EVIDENCE FROM DB
    // ==========================================

    async function loadEvidenceFromDB() {

        if (!db) {
            return;
        }


        for (
            const type of evidenceTypes
        ) {

            const image =
                await new Promise(
                    (resolve) => {

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
                            store.get(type);


                        request.onsuccess =
                            () => {

                                resolve(
                                    request.result ||
                                    null
                                );

                            };


                        request.onerror =
                            () => {

                                resolve(null);

                            };

                    }
                );


            evidencePhotos[type] =
                image;

        }


        updateEvidenceUI();

    }


    // ==========================================
    // CLEAR EVIDENCE FOR NEW INSPECTION
    // ==========================================

    async function clearEvidenceForNewInspection() {

        if (!db) {

            throw new Error(
                "Database is not ready."
            );

        }


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


                const request =
                    store.clear();


                request.onsuccess =
                    () => {

                        evidencePhotos = {
                            front: null,
                            back: null,
                            side: null,
                            batch: null
                        };


                        pendingImage = null;

                        currentEvidence =
                            "front";


                        if (capturedImage) {

                            capturedImage.src =
                                "";

                        }


                        if (
                            capturePreviewContainer
                        ) {

                            capturePreviewContainer
                                .classList
                                .add("hidden");

                        }


                        console.log(
                            "NEW INSPECTION: Old evidence cleared from IndexedDB."
                        );


                        resolve();

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error ||
                            new Error(
                                "Unable to clear previous evidence."
                            )
                        );

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "Unable to clear previous evidence."
                            )
                        );

                    };

            }
        );
    }


    // ==========================================
    // START CAMERA
    // ==========================================

    async function startCamera() {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            showCameraError(
                "Camera is not supported by this browser."
            );

            return;
        }


        hideCameraError();


        try {

            stopCamera();


            stream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        facingMode:
                            facingMode,

                        width: {
                            ideal: 1920
                        },

                        height: {
                            ideal: 1080
                        }

                    },

                    audio: false

                });


            video.srcObject =
                stream;


            await video.play();


            if (placeholder) {

                placeholder.classList.add(
                    "hidden"
                );

            }


            if (overlay) {

                overlay.classList.remove(
                    "hidden"
                );

            }


            if (cameraError) {

                cameraError.classList.add(
                    "hidden"
                );

            }


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


            if (cameraStatus) {

                cameraStatus.textContent =
                    "● LIVE CAMERA";

                cameraStatus.classList.add(
                    "live"
                );

            }


            console.log(
                "Camera started successfully."
            );

        } catch (error) {

            console.error(
                "Camera access error:",
                error
            );


            handleCameraError(
                error
            );

        }

    }


    // ==========================================
    // STOP CAMERA
    // ==========================================

    function stopCamera() {

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    (track) => {

                        track.stop();

                    }
                );


            stream = null;

        }


        if (video) {

            video.srcObject =
                null;

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


        if (overlay) {

            overlay.classList.add(
                "hidden"
            );

        }


        if (cameraStatus) {

            cameraStatus.textContent =
                "● CAMERA OFFLINE";

            cameraStatus.classList.remove(
                "live"
            );

        }

    }


    // ==========================================
    // SWITCH CAMERA
    // ==========================================

    async function switchCamera() {

        facingMode =
            facingMode === "environment"
                ? "user"
                : "environment";


        await startCamera();

    }


    // ==========================================
    // CAPTURE IMAGE
    // ==========================================

    function captureImage() {

        if (
            !stream ||
            !video ||
            !video.videoWidth
        ) {

            showCameraError(
                "Camera is not ready. Please try again."
            );

            return;
        }


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


        if (!context) {

            showCameraError(
                "Unable to capture image."
            );

            return;

        }


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        pendingImage =
            canvas.toDataURL(
                "image/jpeg",
                0.90
            );


        showPreview();

    }


    // ==========================================
    // BROWSE PHOTO
    // ==========================================

    function browsePhoto() {

        const completedCount =
            Object.values(
                evidencePhotos
            )
                .filter(Boolean)
                .length;


        if (
            completedCount >= MAX_EVIDENCE &&
            evidencePhotos[currentEvidence]
        ) {

            alert(
                "Maximum 4 evidence images allowed."
            );

            return;

        }


        if (photoInput) {

            photoInput.value =
                "";

            photoInput.click();

        }

    }


    // ==========================================
    // BROWSE PHOTO INPUT
    // ==========================================

    if (photoInput) {

        photoInput.addEventListener(
            "change",
            (event) => {

                const file =
                    event.target.files?.[0];


                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Please select a valid image file."
                    );

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        pendingImage =
                            reader.result;


                        showPreview();

                    };


                reader.onerror =
                    () => {

                        alert(
                            "Unable to read the selected image."
                        );

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    // ==========================================
    // SHOW PREVIEW
    // ==========================================

    function showPreview() {

        if (!pendingImage) {
            return;
        }


        if (capturedImage) {

            capturedImage.src =
                pendingImage;

        }


        if (
            capturePreviewContainer
        ) {

            capturePreviewContainer
                .classList
                .remove("hidden");

        }


        if (video) {

            video.classList.add(
                "hidden"
            );

        }


        if (overlay) {

            overlay.classList.add(
                "hidden"
            );

        }


        if (captureBtn) {

            captureBtn.disabled =
                true;

        }

    }


    // ==========================================
    // RETAKE
    // ==========================================

    function retakeImage() {

        pendingImage =
            null;


        if (capturedImage) {

            capturedImage.src =
                "";

        }


        if (
            capturePreviewContainer
        ) {

            capturePreviewContainer
                .classList
                .add("hidden");

        }


        if (video) {

            video.classList.remove(
                "hidden"
            );

        }


        if (stream) {

            if (overlay) {

                overlay.classList.remove(
                    "hidden"
                );

            }


            if (captureBtn) {

                captureBtn.disabled =
                    false;

            }

        } else {

            startCamera();

        }

    }


    // ==========================================
    // SAVE CURRENT EVIDENCE
    // ==========================================

    async function saveCurrentEvidence() {

        if (!pendingImage) {

            alert(
                "Please capture or select an image first."
            );

            return;

        }


        const completedCount =
            Object.values(
                evidencePhotos
            )
                .filter(Boolean)
                .length;


        /*
         * Allow replacing an existing slot.
         * Block only when attempting to create
         * a fifth different evidence image.
         */
        if (
            !evidencePhotos[currentEvidence] &&
            completedCount >= MAX_EVIDENCE
        ) {

            alert(
                "Maximum 4 evidence images allowed."
            );

            return;

        }


        try {

            await saveEvidenceToDB(
                currentEvidence,
                pendingImage
            );


            evidencePhotos[currentEvidence] =
                pendingImage;


            pendingImage =
                null;


            if (capturedImage) {

                capturedImage.src =
                    "";

            }


            if (
                capturePreviewContainer
            ) {

                capturePreviewContainer
                    .classList
                    .add("hidden");

            }


            if (video) {

                video.classList.remove(
                    "hidden"
                );

            }


            if (stream) {

                if (overlay) {

                    overlay.classList.remove(
                        "hidden"
                    );

                }


                if (captureBtn) {

                    captureBtn.disabled =
                        false;

                }

            }


            updateEvidenceUI();

            moveToNextEvidence();

        } catch (error) {

            console.error(
                "Evidence save error:",
                error
            );


            alert(
                "Unable to save evidence image."
            );

        }

    }


    // ==========================================
    // SELECT EVIDENCE SLOT
    // ==========================================

    function selectEvidence(type) {

        if (
            !evidenceTypes.includes(type)
        ) {

            return;

        }


        currentEvidence =
            type;


        updateCurrentEvidence();


        document
            .querySelectorAll(
                ".evidence-slot"
            )
            .forEach(
                (slot) => {

                    slot.classList.toggle(
                        "active",
                        slot.dataset.evidence ===
                            type
                    );

                }
            );

    }


    // ==========================================
    // NEXT EVIDENCE
    // ==========================================

    function moveToNextEvidence() {

        const currentIndex =
            evidenceTypes.indexOf(
                currentEvidence
            );


        if (currentIndex === -1) {
            return;
        }


        /*
         * Find the next empty slot first.
         *
         * Front → Back → Side → Batch
         */
        for (
            let i =
                currentIndex + 1;
            i < evidenceTypes.length;
            i++
        ) {

            const nextType =
                evidenceTypes[i];


            if (
                !evidencePhotos[nextType]
            ) {

                selectEvidence(
                    nextType
                );

                return;

            }

        }


        /*
         * If all slots after current
         * are filled, find any empty slot.
         */
        const firstEmpty =
            evidenceTypes.find(
                (type) =>
                    !evidencePhotos[type]
            );


        if (firstEmpty) {

            selectEvidence(
                firstEmpty
            );

        }

    }


    // ==========================================
    // UPDATE CURRENT LABEL
    // ==========================================

    function updateCurrentEvidence() {

        const label =
            evidenceLabels[
                currentEvidence
            ];


        if (currentEvidenceLabel) {

            currentEvidenceLabel.textContent =
                label;

        }


        if (scanPositionLabel) {

            scanPositionLabel.textContent =
                label.toUpperCase();

        }

    }


    // ==========================================
    // UPDATE EVIDENCE UI
    // ==========================================

    function updateEvidenceUI() {

        let completed = 0;


        document
            .querySelectorAll(
                ".evidence-slot"
            )
            .forEach(
                (slot) => {

                    const type =
                        slot.dataset.evidence;


                    const image =
                        evidencePhotos[type];


                    const imageContainer =
                        slot.querySelector(
                            ".slot-image"
                        );


                    const status =
                        slot.querySelector(
                            ".slot-status"
                        );


                    if (image) {

                        completed++;


                        slot.classList.add(
                            "completed"
                        );


                        if (imageContainer) {

                            imageContainer.innerHTML =
                                "";


                            const img =
                                document.createElement(
                                    "img"
                                );


                            img.src =
                                image;


                            img.alt =
                                `${evidenceLabels[type]} evidence`;


                            imageContainer.appendChild(
                                img
                            );

                        }


                        if (status) {

                            status.textContent =
                                "Captured";

                        }

                    } else {

                        slot.classList.remove(
                            "completed"
                        );


                        if (imageContainer) {

                            imageContainer.innerHTML =
                                "<span>＋</span>";

                        }


                        if (status) {

                            status.textContent =
                                "Optional";

                        }

                    }

                }
            );


        // ==========================================
        // COUNT
        // ==========================================

        if (evidenceCount) {

            evidenceCount.textContent =
                completed;

        }


        // ==========================================
        // CONTINUE STATE
        // ==========================================

        if (
            completed >= MIN_EVIDENCE
        ) {

            if (continueBtn) {

                continueBtn.disabled =
                    false;

            }


            if (continueHint) {

                if (
                    completed >= MAX_EVIDENCE
                ) {

                    continueHint.textContent =
                        "4 evidence images captured. Ready for inspection.";

                } else {

                    const remaining =
                        MAX_EVIDENCE -
                        completed;


                    continueHint.textContent =
                        `${completed} evidence image${
                            completed === 1
                                ? ""
                                : "s"
                        } captured. You can add ${
                            remaining
                        } more or continue to inspection.`;

                }

            }

        } else {

            if (continueBtn) {

                continueBtn.disabled =
                    true;

            }


            if (continueHint) {

                continueHint.textContent =
                    "Capture at least 1 evidence image to continue.";

            }

        }

    }


    // ==========================================
    // CONTINUE TO INSPECTION
    // ==========================================

    function continueToInspection() {

        const completedCount =
            Object.values(
                evidencePhotos
            )
                .filter(Boolean)
                .length;


        if (
            completedCount < MIN_EVIDENCE
        ) {

            alert(
                "Please capture at least 1 evidence image."
            );

            return;

        }


        if (
            completedCount > MAX_EVIDENCE
        ) {

            alert(
                "Maximum 4 evidence images are allowed."
            );

            return;

        }


        /*
         * Lightweight inspection marker.
         *
         * Actual images remain in IndexedDB.
         */
        sessionStorage.setItem(
            "eParakhEvidenceReady",
            "true"
        );


        sessionStorage.setItem(
            "eParakhScanSource",
            "camera"
        );


        /*
         * Current inspection is now entering
         * the inspection workflow.
         */
        sessionStorage.setItem(
            "inspectionStarted",
            "true"
        );


        stopCamera();


        window.location.href =
            "inspection.html";

    }


    // ==========================================
    // CAMERA ERROR
    // ==========================================

    function handleCameraError(error) {

        let message =
            "Unable to access the camera.";


        if (
            error?.name ===
            "NotAllowedError"
        ) {

            message =
                "Camera permission was denied. Please allow camera access in your browser settings.";

        } else if (
            error?.name ===
            "NotFoundError"
        ) {

            message =
                "No camera was found on this device.";

        } else if (
            error?.name ===
            "NotReadableError"
        ) {

            message =
                "The camera may already be in use by another application.";

        } else if (
            error?.name ===
            "SecurityError"
        ) {

            message =
                "Camera access is blocked for security reasons.";

        }


        showCameraError(
            message
        );

    }


    // ==========================================
    // SHOW ERROR
    // ==========================================

    function showCameraError(message) {

        if (cameraErrorMessage) {

            cameraErrorMessage.textContent =
                message;

        }


        if (cameraError) {

            cameraError.classList.remove(
                "hidden"
            );

        }


        if (placeholder) {

            placeholder.classList.add(
                "hidden"
            );

        }


        if (overlay) {

            overlay.classList.add(
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


    // ==========================================
    // HIDE ERROR
    // ==========================================

    function hideCameraError() {

        if (cameraError) {

            cameraError.classList.add(
                "hidden"
            );

        }

    }


    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    startCameraBtn?.addEventListener(
        "click",
        startCamera
    );


    retryCameraBtn?.addEventListener(
        "click",
        startCamera
    );


    switchCameraBtn?.addEventListener(
        "click",
        switchCamera
    );


    captureBtn?.addEventListener(
        "click",
        captureImage
    );


    stopCameraBtn?.addEventListener(
        "click",
        stopCamera
    );


    browsePhotoBtn?.addEventListener(
        "click",
        browsePhoto
    );


    saveEvidenceBtn?.addEventListener(
        "click",
        saveCurrentEvidence
    );


    retakeBtn?.addEventListener(
        "click",
        retakeImage
    );


    continueBtn?.addEventListener(
        "click",
        continueToInspection
    );


    // ==========================================
    // EVIDENCE SLOT EVENTS
    // ==========================================

    document
        .querySelectorAll(
            ".evidence-slot"
        )
        .forEach(
            (slot) => {

                slot.addEventListener(
                    "click",
                    () => {

                        selectEvidence(
                            slot.dataset.evidence
                        );

                    }
                );

            }
        );


    // ==========================================
    // PAGE EXIT
    // ==========================================

    window.addEventListener(
        "beforeunload",
        () => {

            stopCamera();

        }
    );


    // ==========================================
    // INITIALIZE
    // ==========================================

    async function initialize() {

        try {

            await openDatabase();


            /*
             * IMPORTANT:
             *
             * Result → New Inspection
             * and Login → Start Inspection
             * set this flag.
             *
             * Only in that case do we clear
             * previous evidence.
             */
            const startNewInspection =
                sessionStorage.getItem(
                    "eParakhStartNewInspection"
                );


            if (
                startNewInspection ===
                "true"
            ) {

                await clearEvidenceForNewInspection();


                /*
                 * Consume the flag.
                 * This prevents the evidence from
                 * being cleared again on refresh.
                 */
                sessionStorage.removeItem(
                    "eParakhStartNewInspection"
                );

            } else {

                /*
                 * Existing inspection:
                 * load the already captured evidence.
                 */
                await loadEvidenceFromDB();

            }

        } catch (error) {

            console.error(
                "IndexedDB initialization failed:",
                error
            );

        }


        updateCurrentEvidence();

        updateEvidenceUI();


        if (overlay) {

            overlay.classList.add(
                "hidden"
            );

        }


        if (cameraError) {

            cameraError.classList.add(
                "hidden"
            );

        }


        if (capturePreviewContainer) {

            capturePreviewContainer
                .classList
                .add("hidden");

        }


        console.log(
            "e-PARAKH multi-evidence camera initialized."
        );

    }


    initialize();

});