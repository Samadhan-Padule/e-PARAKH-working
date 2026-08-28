import statistics

import cv2

from .readability_analyzer import analyze_readability, estimate_font_size


def _status(blur, brightness, contrast, width, height):
    if width < 640 or height < 480:
        return "REVIEW_REQUIRED"
    if blur < 80 or brightness < 35 or brightness > 225 or contrast < 25:
        return "REVIEW_REQUIRED"
    return "PASS"


def analyze_image_quality(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return {
            "status": "NOT_DETECTABLE",
            "confidence": None,
            "reason": "The image could not be decoded.",
            "width": None,
            "height": None,
            "blur_estimate": None,
            "brightness": None,
            "contrast": None,
            "requires_human_verification": True,
        }
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape[:2]
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    contrast = float(gray.std())
    status = _status(blur, brightness, contrast, width, height)
    reasons = []
    if width < 640 or height < 480:
        reasons.append("Image resolution is limited for dependable text review.")
    if blur < 80:
        reasons.append("Image sharpness is low.")
    if brightness < 35 or brightness > 225:
        reasons.append("Image brightness is outside the comfortable analysis range.")
    if contrast < 25:
        reasons.append("Image contrast is low.")
    return {
        "status": status,
        "confidence": 0.9 if status == "PASS" else 0.6,
        "reason": "Resolution, sharpness, brightness, and contrast are within heuristic ranges." if not reasons else " ".join(reasons),
        "width": width,
        "height": height,
        "blur_estimate": round(blur, 2),
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "requires_human_verification": True,
    }


def analyze_ocr_confidence(detections):
    scores = [item["confidence"] for item in detections if item.get("confidence") is not None]
    average = statistics.fmean(scores) if scores else None
    low_confidence = [
        {"text": item.get("text"), "confidence": item.get("confidence"), "bbox": item.get("bbox")}
        for item in detections
        if item.get("confidence") is not None and item["confidence"] < 0.75
    ]
    if average is None:
        status = "NOT_DETECTABLE"
        reason = "OCR confidence was not available."
    elif average < 0.75:
        status = "REVIEW_REQUIRED"
        reason = "Some OCR detections have low confidence; this is not a legal non-compliance finding."
    else:
        status = "PASS"
        reason = "OCR confidence is adequate for preliminary machine assistance; human verification remains required."
    return {
        "status": status,
        "average_confidence": round(average, 4) if average is not None else None,
        "low_confidence_detections": low_confidence,
        "detection_count": len(detections),
        "reason": reason,
        "requires_human_verification": True,
    }


def analyze_image(image_path, detections, extracted_data):
    image_quality = analyze_image_quality(image_path)
    ocr_confidence = analyze_ocr_confidence(detections)
    readability = analyze_readability(image_quality, detections)
    font_size = estimate_font_size(detections)
    return {
        "image_quality": image_quality,
        "ocr_confidence": ocr_confidence,
        "readability": readability,
        "font_size": font_size,
    }
