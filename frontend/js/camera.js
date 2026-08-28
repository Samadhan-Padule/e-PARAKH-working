// ==========================================
// e-PARAKH - Camera Module
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const video = document.getElementById("cameraPreview");
    const placeholder = document.getElementById("cameraPlaceholder");
    const overlay = document.getElementById("cameraOverlay");

    const cameraError = document.getElementById("cameraError");
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


    // ==========================================
    // CAMERA STATE
    // ==========================================

    let stream = null;

    let facingMode = "environment";

    let capturedImageData = null;


    // ==========================================
    // START CAMERA
    // ==========================================

    async function startCamera() {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

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
                        facingMode: facingMode,
                        width: {
                            ideal: 1920
                        },
                        height: {
                            ideal: 1080
                        }
                    },
                    audio: false
                });

            video.srcObject = stream;

            await video.play();

            placeholder.classList.add("hidden");

            overlay.classList.remove("hidden");

            cameraError.classList.add("hidden");

            captureBtn.disabled = false;

            stopCameraBtn.disabled = false;

            switchCameraBtn.disabled = false;

            console.log("Camera started successfully.");

        } catch (error) {

            console.error(
                "Camera access error:",
                error
            );

            handleCameraError(error);
        }
    }


    // ==========================================
    // STOP CAMERA
    // ==========================================

    function stopCamera() {

        if (stream) {

            stream.getTracks().forEach((track) => {
                track.stop();
            });

            stream = null;
        }

        if (video) {
            video.srcObject = null;
        }

        captureBtn.disabled = true;
        stopCameraBtn.disabled = true;
        switchCameraBtn.disabled = true;

        overlay.classList.add("hidden");

        console.log("Camera stopped.");
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

        if (!stream || !video.videoWidth) {

            showCameraError(
                "Camera is not ready. Please try again."
            );

            return;
        }

        const canvas =
            document.createElement("canvas");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context =
            canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        capturedImageData =
            canvas.toDataURL(
                "image/jpeg",
                0.92
            );

        capturedImage.src =
            capturedImageData;

        capturePreviewContainer
            .classList
            .remove("hidden");

        video.classList.add("hidden");

        overlay.classList.add("hidden");

        captureBtn.disabled = true;

        console.log(
            "Product image captured successfully."
        );
    }


    // ==========================================
    // RETAKE IMAGE
    // ==========================================

    function retakeImage() {

        capturedImageData = null;

        capturedImage.src = "";

        capturePreviewContainer
            .classList
            .add("hidden");

        video.classList.remove("hidden");

        overlay.classList.remove("hidden");

        if (!stream) {
            startCamera();
        } else {
            captureBtn.disabled = false;
        }
    }


    // ==========================================
    // CONTINUE
    // ==========================================

    function continueWithImage() {

    if (!capturedImageData) {

        alert(
            "Please capture a product image first."
        );

        return;
    }

    try {

        // Save image for inspection page
        sessionStorage.setItem(
            "eParakhCapturedImage",
            capturedImageData
        );

        sessionStorage.setItem(
            "eParakhScanSource",
            "camera"
        );

        console.log(
            "Captured image saved successfully."
        );

        // Go to inspection page
        window.location.href =
            "inspection.html";

    } catch (error) {

        console.error(
            "Unable to save captured image:",
            error
        );

        alert(
            "Unable to continue with this image."
        );
    }
}
    // ==========================================
    // CAMERA ERROR
    // ==========================================

    function handleCameraError(error) {

        let message =
            "Unable to access the camera.";

        if (error.name === "NotAllowedError") {

            message =
                "Camera permission was denied. Please allow camera access in your browser settings.";

        } else if (error.name === "NotFoundError") {

            message =
                "No camera was found on this device.";

        } else if (error.name === "NotReadableError") {

            message =
                "The camera may already be in use by another application.";

        } else if (error.name === "SecurityError") {

            message =
                "Camera access is blocked for security reasons.";

        }

        showCameraError(message);
    }


    // ==========================================
    // SHOW ERROR
    // ==========================================

    function showCameraError(message) {

        cameraErrorMessage.textContent = message;

        cameraError.classList.remove("hidden");

        placeholder.classList.add("hidden");

        overlay.classList.add("hidden");

        captureBtn.disabled = true;

        stopCameraBtn.disabled = true;

        switchCameraBtn.disabled = true;
    }


    // ==========================================
    // HIDE ERROR
    // ==========================================

    function hideCameraError() {

        cameraError.classList.add("hidden");
    }


    // ==========================================
    // EVENT LISTENERS
    // ==========================================

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


    if (switchCameraBtn) {

        switchCameraBtn.addEventListener(
            "click",
            switchCamera
        );
    }


    if (captureBtn) {

        captureBtn.addEventListener(
            "click",
            captureImage
        );
    }


    if (stopCameraBtn) {

        stopCameraBtn.addEventListener(
            "click",
            stopCamera
        );
    }


    if (retakeBtn) {

        retakeBtn.addEventListener(
            "click",
            retakeImage
        );
    }


    if (continueBtn) {

        continueBtn.addEventListener(
            "click",
            continueWithImage
        );
    }


    // ==========================================
    // PAGE EXIT CLEANUP
    // ==========================================

    window.addEventListener(
        "beforeunload",
        () => {
            stopCamera();
        }
    );


    // ==========================================
    // INITIAL STATE
    // ==========================================

    overlay.classList.add("hidden");
    cameraError.classList.add("hidden");
    capturePreviewContainer.classList.add("hidden");

    console.log(
        "e-PARAKH camera module initialized."
    );

});