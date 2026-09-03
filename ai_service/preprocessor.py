import os
from typing import Any, Dict, Iterable, Optional, Union

import cv2
import numpy as np


def _to_bgr_array(image_input: Any) -> np.ndarray:
    if isinstance(image_input, (str, os.PathLike)):
        image = cv2.imread(str(image_input), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError(f"Unable to read image from path: {image_input}")
        return image

    if isinstance(image_input, bytes):
        array = np.frombuffer(image_input, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Unable to decode image bytes")
        return image

    if hasattr(image_input, "read"):
        data = image_input.read()
        if not data:
            raise ValueError("Uploaded image stream is empty")
        return _to_bgr_array(data)

    image = np.asarray(image_input)
    if image.size == 0:
        raise ValueError("Image array is empty")
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    elif image.ndim == 3 and image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    return image


def _detect_blur_score(image_bgr: np.ndarray) -> float:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return float(laplacian.var())


def _remove_shadow_and_uneven_lighting(image_bgr: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    kernel = np.ones((31, 31), np.uint8)
    dilated = cv2.dilate(l, kernel, iterations=1)
    background = cv2.medianBlur(dilated, 51)
    diff = cv2.absdiff(l, background)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    corrected = clahe.apply(diff)
    return cv2.cvtColor(cv2.merge([corrected, a, b]), cv2.COLOR_LAB2BGR)


def _perspective_correct_if_needed(image_bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10,
    )

    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image_bgr

    largest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest) < 1000:
        return image_bgr

    perimeter = cv2.arcLength(largest, True)
    approx = cv2.approxPolyDP(largest, 0.02 * perimeter, True)
    if len(approx) != 4:
        return image_bgr

    box = np.array(approx, dtype="float32")
    box = box.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")
    s = box.sum(axis=1)
    rect[0] = box[np.argmin(s)]
    rect[2] = box[np.argmax(s)]
    diff = np.diff(box, axis=1)
    rect[1] = box[np.argmin(diff)]
    rect[3] = box[np.argmax(diff)]

    width = max(np.linalg.norm(rect[1] - rect[2]), np.linalg.norm(rect[0] - rect[3]))
    height = max(np.linalg.norm(rect[2] - rect[3]), np.linalg.norm(rect[1] - rect[0]))
    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1],
    ], dtype="float32")

    transform = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image_bgr, transform, (int(width), int(height)))
    return warped


def preprocess_package_image(
    image_input: Any,
    max_size: int = 700,
    return_metadata: bool = False,
) -> Union[np.ndarray, Dict[str, Any]]:
    """
    Improve package label images for OCR:
    - detect blur via Laplacian variance,
    - remove shadows/uneven illumination,
    - apply adaptive thresholding,
    - correct mild perspective distortion
    - downscale aggressively before OCR when the image is oversized
    """
    image = _to_bgr_array(image_input)

    height, width = image.shape[:2]
    if max(height, width) > max_size:
        scale = max_size / max(height, width)
        image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)

    blur_score = _detect_blur_score(image)
    if blur_score < 120:
        sharpen_kernel = np.array([
            [-1, -1, -1],
            [-1, 9, -1],
            [-1, -1, -1],
        ], dtype=np.float32)
        image = cv2.filter2D(image, -1, sharpen_kernel)

    corrected = _remove_shadow_and_uneven_lighting(image)
    corrected = _perspective_correct_if_needed(corrected)

    gray = cv2.cvtColor(corrected, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    thresholded = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10,
    )

    processed = cv2.bitwise_and(corrected, corrected, mask=thresholded)
    processed = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)

    metadata = {
        "blur_score": round(blur_score, 2),
        "was_sharpened": blur_score < 120,
        "width": int(processed.shape[1]),
        "height": int(processed.shape[0]),
        "thresholded": True,
    }

    if return_metadata:
        return processed, metadata
    return processed


__all__ = ["preprocess_package_image"]
