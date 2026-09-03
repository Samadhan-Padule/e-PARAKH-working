import re


DECLARATION_LABELS = {
    "product_name": ("product", "commodity"),
    "manufacturer": ("manufactured", "manufacturer", "packed by", "imported by", "marketed by"),
    "manufacturer_address": ("address", "gat no", "road", "dist."),
    "net_quantity": ("net weight", "net quantity", "net wt"),
    "mrp": ("mrp", "maximum retail price"),
    "date_of_manufacture": ("date of manufacture", "manufactured on", "packed on", "mfg date"),
    "use_by": ("use by", "best before", "expiry"),
    "batch_number": ("batch", "lot no"),
    "customer_care": ("customer care", "consumer care", "helpline", "toll free"),
    "country_of_origin": ("country of origin", "made in", "product of"),
    "brand_owner": ("brand owner",),
    "epr_registration": ("epr",),
    "fssai_license": ("fssai", "fssa", "lic. no"),
}


def _location(bbox, width, height):
    center_x = (bbox[0] + bbox[2]) / 2
    center_y = (bbox[1] + bbox[3]) / 2
    horizontal = "left" if center_x < width / 3 else "right" if center_x > (2 * width / 3) else "center"
    vertical = "top" if center_y < height / 3 else "bottom" if center_y > (2 * height / 3) else "middle"
    return f"{vertical}-{horizontal}"


def analyze_placement(detections, extracted_data, image_quality):
    width = image_quality.get("width") or 0
    height = image_quality.get("height") or 0
    placements = []
    evidence = []
    for field, value in extracted_data.items():
        keywords = DECLARATION_LABELS.get(field, (field.replace("_", " "),))
        matches = []
        for item in detections:
            text = str(item.get("text") or "")
            if any(re.search(rf"\b{re.escape(keyword)}\b", text, re.IGNORECASE) for keyword in keywords):
                matches.append(item)
        if matches:
            item = matches[0]
            bbox = item.get("bbox")
            location = _location(bbox, width, height) if bbox and width and height else None
            placements.append({
                "field": field,
                "detected": value is not None,
                "bbox": bbox,
                "location": location,
                "machine_evaluable": False,
                "status": "REVIEW_REQUIRED",
                "confidence": item.get("confidence"),
                "reason": "A related OCR label was located, but legal placement requires package-context and human verification.",
                "requires_human_verification": True,
            })
            if value is None or (item.get("confidence") is not None and item["confidence"] < 0.75):
                evidence.append({
                    "field": field,
                    "status": "REVIEW_REQUIRED",
                    "reason": "Declaration label detected but value is missing or OCR confidence is limited.",
                    "bbox": bbox,
                    "confidence": item.get("confidence"),
                })
        elif value is None:
            evidence.append({
                "field": field,
                "status": "NOT_DETECTABLE",
                "reason": "No declaration label or value bounding box was detected; image review is required.",
                "bbox": None,
                "confidence": None,
            })
    return {"status": "REVIEW_REQUIRED", "placements": placements, "requires_human_verification": True}, evidence
