/* =========================================================
   e-PARAKH
   PRODUCT SCANNER
   Camera + Image Upload + AI Analysis Navigation
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
        AI SERVICE URL
    ===================================================== */

    const AI_SERVICE_URL = "http://localhost:8000";


    /* =====================================================
        START CAMERA
    ===================================================== */

    if (startCameraBtn) {
        startCameraBtn.addEventListener("click", startCamera);
    }

    async function startCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showCameraError("Camera access is not supported by this browser.");
                return;
            }

            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            openCamera();
        } catch (error) {
            console.error("Camera Error:", error);
            if (error.name === "NotAllowedError") {
                showCameraError("Camera permission was denied. Please allow camera access in your browser.");
            } else if (error.name === "NotFoundError") {
                showCameraError("No camera was found on this device.");
            } else {
                showCameraError("Unable to access the camera. Please check your browser permissions.");
            }
        }
    }


    /* =====================================================
        OPEN CAMERA
    ===================================================== */

    function openCamera() {
        cameraArea.innerHTML = "";
        cameraArea.classList.add("camera-active");

        const video = document.createElement("video");
        video.id = "cameraVideo";
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = cameraStream;

        cameraArea.appendChild(video);

        const controls = document.createElement("div");
        controls.className = "camera-controls";

        const captureBtn = document.createElement("button");
        captureBtn.type = "button";
        captureBtn.className = "capture-btn";
        captureBtn.innerHTML = `
            <span class="capture-circle"></span>
            Capture Product
        `;

        const stopBtn = document.createElement("button");
        stopBtn.type = "button";
        stopBtn.className = "stop-camera-btn";
        stopBtn.textContent = "Stop Camera";

        controls.appendChild(captureBtn);
        controls.appendChild(stopBtn);
        cameraArea.appendChild(controls);

        captureBtn.addEventListener("click", () => {
            captureImage(video);
        });

        stopBtn.addEventListener("click", () => {
            stopCamera();
        });
    }


    /* =====================================================
        CAPTURE IMAGE
    ===================================================== */

    function captureImage(video) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) {
                alert("Unable to capture image.");
                return;
            }

            selectedImage = new File(
                [blob],
                "camera-capture.jpg",
                { type: "image/jpeg" }
            );

            const imageUrl = URL.createObjectURL(selectedImage);
            imagePreview.src = imageUrl;
            fileName.textContent = "Camera Capture";
            previewArea.hidden = false;
            continueBtn.disabled = false;

            stopCamera();
            showSuccess("Product image captured successfully.");
        }, "image/jpeg", 0.92);
    }


    /* =====================================================
        STOP CAMERA
    ===================================================== */

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }

        cameraArea.classList.remove("camera-active");
        restoreCameraPlaceholder();
    }


    /* =====================================================
        RESTORE CAMERA PLACEHOLDER
    ===================================================== */

    function restoreCameraPlaceholder() {
        cameraArea.innerHTML = `
            <div class="camera-placeholder">
                <div class="camera-icon">📷</div>
                <h3>Ready to Scan</h3>
                <p>Position the packaged commodity label clearly inside the camera frame.</p>
                <button type="button" class="primary-btn" id="startCameraBtn">
                    Start Camera <span>→</span>
                </button>
            </div>
        `;

        const newButton = document.getElementById("startCameraBtn");
        if (newButton) {
            newButton.addEventListener("click", startCamera);
        }
    }


    /* =====================================================
        FILE UPLOAD
    ===================================================== */

    if (productImage) {
        productImage.addEventListener("change", handleFileUpload);
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            alert("Please select a JPG, PNG or WEBP image.");
            productImage.value = "";
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert("Image size must be less than 10 MB.");
            productImage.value = "";
            return;
        }

        selectedImage = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            fileName.textContent = file.name;
            previewArea.hidden = false;
            continueBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }


    /* =====================================================
        REMOVE IMAGE
    ===================================================== */

    if (removeImageBtn) {
        removeImageBtn.addEventListener("click", () => {
            selectedImage = null;
            if (productImage) productImage.value = "";
            imagePreview.src = "";
            fileName.textContent = "-";
            previewArea.hidden = true;
            continueBtn.disabled = true;
        });
    }


    /* =====================================================
        ANALYZE PRODUCT & NAVIGATE
    ===================================================== */

    if (continueBtn) {
        continueBtn.addEventListener("click", analyzeProduct);
    }

    async function analyzeProduct() {
        if (!selectedImage) {
            alert("Please scan or upload a product image first.");
            return;
        }

        continueBtn.disabled = true;
        const originalText = continueBtn.innerHTML;
        continueBtn.innerHTML = `
            <span>Navigating to Inspection...</span>
            <span class="loading-spinner"></span>
        `;

        // 1. Convert Image to Base64 for local storage
        const reader = new FileReader();
        reader.onload = async () => {
            // Save Image base64 for Inspection Page Preview & Analysis
            localStorage.setItem("scannedProductImage", reader.result);
            sessionStorage.setItem("inspectionStarted", "true");

            // Update local inspection counter
            let count = parseInt(sessionStorage.getItem("inspectionCount") || "0", 10);
            count += 1;
            sessionStorage.setItem("inspectionCount", count.toString());

            // 2. Try Calling AI Service (Optional step on Scan screen)
            try {
                const formData = new FormData();
                formData.append("image", selectedImage, selectedImage.name || "product.jpg");

                const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.status === "success") {
                        sessionStorage.setItem("analysisResult", JSON.stringify(result));
                        sessionStorage.setItem("lastInspection", JSON.stringify({
                            filename: result.filename,
                            status: result.compliance_result?.overall_status,
                            score: result.compliance_result?.score,
                            analyzedAt: new Date().toISOString()
                        }));
                    }
                }
            } catch (err) {
                console.warn("AI Backend service unreachable at scan stage. Inspection page will handle analysis execution.", err);
            }

            // 3. Navigation Fix: Use path relative to current folder location
            // 3. Navigation Fix: Navigate to inspection page

window.location.href = "pages/inspection.html";
        };

        reader.readAsDataURL(selectedImage);
    }


    /* =====================================================
        LOGOUT
    ===================================================== */

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }


    /* =====================================================
        CAMERA ERROR DISPLAY
    ===================================================== */

    function showCameraError(message) {
        cameraArea.innerHTML = `
            <div class="camera-placeholder">
                <div class="camera-icon">⚠</div>
                <h3>Camera Access Required</h3>
                <p>${message}</p>
                <button type="button" class="primary-btn" id="retryCameraBtn">
                    Try Again →
                </button>
            </div>
        `;

        const retryButton = document.getElementById("retryCameraBtn");
        if (retryButton) {
            retryButton.addEventListener("click", startCamera);
        }
    }


    /* =====================================================
        SUCCESS MESSAGE UI
    ===================================================== */

    function showSuccess(message) {
        const messageBox = document.createElement("div");
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
        messageBox.textContent = message;

        if (cameraArea.parentElement) {
            cameraArea.parentElement.insertBefore(messageBox, cameraArea.nextSibling);
        }

        setTimeout(() => {
            if (messageBox.parentElement) {
                messageBox.remove();
            }
        }, 3000);
    }


    /* =====================================================
        INITIAL COUNTER SET
    ===================================================== */

    if (inspectionCount) {
        const count = sessionStorage.getItem("inspectionCount") || "0";
        inspectionCount.textContent = count;
    }

});