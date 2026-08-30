import re

from .field_parser import (
    EPR_PATTERN,
    FSSAI_PATTERN,
    EMAIL_PATTERN,
    NUTRITION_LABELS,
    PHONE_PATTERN,
    WEBSITE_PATTERN,
    find_label,
    is_valid_batch_number,
    is_valid_date,
    is_valid_epr_number,
    is_valid_fssai,
    is_valid_mrp,
    is_valid_quantity,
    normalize_lines,
    normalize_value,
    parse_labeled_fields,
)


STRUCTURED_FIELDS = (
    "product_name", "brand_name", "manufacturer", "manufacturer_address", "net_quantity",
    "mrp", "batch_number", "date_of_manufacture", "use_by", "ingredients", "fssai_license",
    "country_of_origin", "customer_care", "brand_owner", "epr_registration",
)


def _next_non_label(lines, index):
    for line in lines[index + 1:]:
        field, _ = find_label(line)
        if field:
            return None
        if line.lower() not in NUTRITION_LABELS:
            return line
    return None


def _validated_candidate(lines, label_indexes, field, validator):
    for index, current_field, inline_value in label_indexes:
        if current_field != field:
            continue
        candidates = [inline_value] if inline_value else []
        next_value = _next_non_label(lines, index) if not inline_value else None
        if next_value:
            candidates.append(next_value)
        for candidate in candidates:
            if validator(candidate):
                return normalize_value(candidate)
    return None


def _extract_manufacturer(lines, label_indexes):
    for index, field, inline_value in label_indexes:
        if field != "manufacturer":
            continue
        name = inline_value or _next_non_label(lines, index)
        if not name or name.lower() in {"brand owner", "customer care", "nutritional information"}:
            continue
        return normalize_value(name)
    return None


def _extract_labeled_value(lines, label_indexes, target_field):
    for index, field, inline_value in label_indexes:
        if field != target_field:
            continue
        value = inline_value or _next_non_label(lines, index)
        if value:
            return normalize_value(value)
    return None


def _extract_manufacturer_address(lines, label_indexes):
    for index, field, inline_value in label_indexes:
        if field not in {"manufacturer", "manufacturer_address"}:
            continue
        start = index + 1 if not inline_value else index + 1
        address_lines = []
        name_consumed = bool(inline_value)
        for line in lines[start:]:
            next_field, _ = find_label(line)
            if next_field or line.lower() in NUTRITION_LABELS or line.lower().startswith(("fssa", "lic. no", "lic no")):
                break
            if not name_consumed:
                name_consumed = True
                continue
            if re.search(r"\b(gat|road|tal\.?|dist\.?|district|india|maharashtra|address|pune)\b", line, re.IGNORECASE) or address_lines:
                address_lines.append(line)
        if address_lines:
            return normalize_value(" ".join(address_lines))
    return None


def _extract_ingredients(lines, label_indexes):
    for index, field, inline_value in label_indexes:
        if field == "ingredients":
            if inline_value:
                return normalize_value(inline_value)
            values = []
            for line in lines[index + 1:]:
                next_field, _ = find_label(line)
                if next_field:
                    break
                if line.lower() not in NUTRITION_LABELS:
                    values.append(line)
            return normalize_value(" ".join(values))
    return None


def _extract_contact(lines, label_indexes):
    phone = []
    emails = []
    websites = []
    for index, field, inline_value in label_indexes:
        if field != "customer_care":
            continue
        contact_lines = ([inline_value] if inline_value else []) + lines[index + 1:]
        for line in contact_lines:
            if find_label(line)[0] and find_label(line)[0] != "customer_care":
                break
            phone.extend(PHONE_PATTERN.findall(line))
            emails_found = EMAIL_PATTERN.findall(line)
            emails.extend(emails_found)
            website_line = EMAIL_PATTERN.sub("", line)
            websites.extend(WEBSITE_PATTERN.findall(website_line))
    parts = []
    if phone:
        parts.append(f"Phone: {normalize_value(phone[0])}")
    if emails:
        parts.append(f"Email: {normalize_value(emails[0])}")
    if websites:
        website = websites[0].rstrip(".,)")
        if not website.lower().startswith(("http://", "https://")):
            website = website.replace("http://", "")
        parts.append(f"Website: {website}")
    return "; ".join(parts) or None


def _find_number_after_label(lines, label_indexes, field, pattern, validator):
    for index, current_field, inline_value in label_indexes:
        if current_field != field:
            continue
        candidates = [inline_value] if inline_value else []
        candidates.extend(lines[index:index + 8])
        for line in candidates:
            match = pattern.search(line or "")
            candidate = match.group(0) if match else line
            if validator(candidate):
                return normalize_value(candidate)
    return None


def _infer_product_name(lines, label_indexes):
    """
    Extract product name from OCR text.

    Priority:
    1. Explicit product-name label
    2. Strong product candidate near beginning of OCR
    3. Safe fallback

    Avoids OCR noise, addresses, nutrition text, refund/EPR text,
    customer-care text and long sentences.
    """

    # ---------------------------------------------------------
    # 1. Explicitly labelled product name
    # ---------------------------------------------------------
    for index, field, inline_value in label_indexes:
        if field == "product_name" and inline_value:
            value = normalize_value(inline_value)
            if value:
                return value

    # ---------------------------------------------------------
    # 2. Product name near beginning of OCR
    # ---------------------------------------------------------
    stop_terms = (
        "ingredients",
        "allergen advice",
        "storage condition",
        "instructions for use",
        "warning",
        "manufactured by",
        "packed by",
        "nutritional information",
        "fssai",
        "lic. no",
    )

    noise_terms = (
        "aaag",
        "refund",
        "consumer complaints",
        "retain the package",
        "per kg",
        "per pack",
        "per serve",
        "scan the qr",
        "follow us",
        "epr",
        "phone:",
        "email:",
        "website:",
    )

    # Only inspect the first 15 OCR lines.
    for line in lines[:15]:
        value = normalize_value(line)

        if not value:
            continue

        lower = value.lower()

        # Ignore obvious OCR noise.
        if lower in noise_terms:
            continue

        # Stop at declaration sections.
        if any(term in lower for term in stop_terms):
            break

        # Ignore noise-containing sentences.
        if any(term in lower for term in noise_terms):
            continue

        # Product names normally should not contain many digits.
        if sum(char.isdigit() for char in value) > 3:
            continue

        # Reject long sentences.
        if len(value) > 80:
            continue

        # Reject address-like text.
        if re.search(
            r"\b(gat|road|tal\.?|dist\.?|district|"
            r"maharashtra|pune|india|address)\b",
            value,
            re.IGNORECASE,
        ):
            continue

        # Reject nutrition labels.
        if lower in NUTRITION_LABELS:
            continue

        # Reject obviously tiny OCR garbage.
        if len(value) < 4:
            continue

        # Avoid lines consisting mostly of symbols.
        letters = sum(char.isalpha() for char in value)
        if letters < 3:
            continue

        return value

    # ---------------------------------------------------------
    # 3. Safe fallback
    # ---------------------------------------------------------
    for line in lines:
        value = normalize_value(line)

        if not value:
            continue

        lower = value.lower()

        if len(value) < 4 or len(value) > 80:
            continue

        if any(term in lower for term in noise_terms):
            continue

        if any(term in lower for term in (
            "ingredients",
            "manufacturer",
            "manufactured by",
            "nutritional information",
            "customer care",
            "brand owner",
            "product of",
            "consumer complaints",
            "fssai",
            "mrp",
            "batch",
            "net weight",
            "net quantity",
        )):
            continue

        if re.search(
            r"\b(gat|road|tal\.?|dist\.?|district|"
            r"maharashtra|pune|india|address)\b",
            value,
            re.IGNORECASE,
        ):
            continue

        if sum(char.isdigit() for char in value) > 3:
            continue

        letters = sum(char.isalpha() for char in value)
        if letters < 3:
            continue

        return value

    return None


def extract_declarations(raw_text):
    lines = normalize_lines(raw_text)
    parsed, lines, label_indexes = parse_labeled_fields(lines)
    extracted = {field: None for field in STRUCTURED_FIELDS}
    extracted["product_name"] = _infer_product_name(lines, label_indexes)
    extracted["brand_name"] = parsed.get("brand_name")
    extracted["manufacturer"] = _extract_manufacturer(lines, label_indexes)
    extracted["manufacturer_address"] = _extract_manufacturer_address(lines, label_indexes)
    extracted["net_quantity"] = _validated_candidate(lines, label_indexes, "net_quantity", is_valid_quantity)
    extracted["mrp"] = _validated_candidate(lines, label_indexes, "mrp", is_valid_mrp)
    extracted["batch_number"] = _validated_candidate(lines, label_indexes, "batch_number", is_valid_batch_number)
    extracted["date_of_manufacture"] = _validated_candidate(lines, label_indexes, "date_of_manufacture", is_valid_date)
    extracted["use_by"] = _validated_candidate(lines, label_indexes, "use_by", is_valid_date)
    extracted["ingredients"] = _extract_ingredients(lines, label_indexes)
    extracted["customer_care"] = _extract_contact(lines, label_indexes)
    extracted["fssai_license"] = _find_number_after_label(lines, label_indexes, "fssai_license", FSSAI_PATTERN, is_valid_fssai)
    if extracted["fssai_license"] is None and any("fssai" in line.lower() or "fssa" in line.lower() for line in lines):
        extracted["fssai_license"] = next((normalize_value(match.group(0)) for line in lines for match in FSSAI_PATTERN.finditer(line)), None)
    extracted["country_of_origin"] = parsed.get("country_of_origin")
    extracted["brand_owner"] = _extract_labeled_value(lines, label_indexes, "brand_owner")
    extracted["epr_registration"] = _find_number_after_label(lines, label_indexes, "epr_registration", EPR_PATTERN, is_valid_epr_number)
    return extracted