import statistics


UNCERTAIN_STATUS = "REVIEW_REQUIRED"


def _number(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def analyze_readability(image_quality, detections):
    scores = [_number(item.get("confidence")) for item in detections if item.get("confidence") is not None]
    average_confidence = statistics.fmean(scores) if scores else None
    blur = _number(image_quality.get("blur_estimate"))
    contrast = _number(image_quality.get("contrast"))
    quality_status = image_quality.get("status", UNCERTAIN_STATUS)
    reasons = []
    if quality_status != "PASS":
        reasons.append("Overall image quality is not confidently sufficient.")
    if blur < 80:
        reasons.append("Low sharpness may reduce text readability.")
    if contrast < 25:
        reasons.append("Low contrast may reduce text readability.")
    if average_confidence is None or average_confidence < 0.75:
        reasons.append("OCR confidence is insufficient for a reliable readability conclusion.")
    status = "PASS" if not reasons else UNCERTAIN_STATUS
    return {
        "status": status,
        "confidence": round(average_confidence, 4) if average_confidence is not None else None,
        "reason": "Text regions appear readable from available signals." if not reasons else " ".join(reasons),
        "text_regions": len(detections),
        "requires_human_verification": True,
    }


def estimate_font_size(detections):
    heights = []
    for item in detections:
        bbox = item.get("bbox") or []
        if len(bbox) == 4:
            heights.append(max(0.0, float(bbox[3]) - float(bbox[1])))
    if not heights:
        return {
            "status": "NOT_DETECTABLE",
            "estimated_relative_size": None,
            "comparison_reference": "No OCR bounding boxes available.",
            "confidence": None,
            "requires_human_verification": True,
        }
    median_height = statistics.median(heights)
    if median_height < 12:
        relative_size = "small"
    elif median_height < 28:
        relative_size = "medium"
    else:
        relative_size = "large"
    confidence = min(0.95, 0.45 + min(len(heights), 20) / 40)
    return {
        "status": "REVIEW_REQUIRED",
        "estimated_relative_size": relative_size,
        "comparison_reference": f"Median OCR text-region height: {median_height:.1f} pixels; relative only, not a physical font measurement.",
        "confidence": round(confidence, 4),
        "requires_human_verification": True,
    }
