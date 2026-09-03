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
    "product_name",
    "brand_name",
    "manufacturer",
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "batch_number",
    "date_of_manufacture",
    "use_by",
    "ingredients",
    "fssai_license",
    "country_of_origin",
    "customer_care",
    "brand_owner",
    "epr_registration",
)


# ============================================================
# COMMON HELPERS
# ============================================================

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

        candidates = []

        if inline_value:
            candidates.append(inline_value)
        else:
            next_value = _next_non_label(lines, index)

            if next_value:
                candidates.append(next_value)

        for candidate in candidates:
            if validator(candidate):
                return normalize_value(candidate)

    return None


# ============================================================
# MANUFACTURER
# ============================================================

def _extract_manufacturer(lines, label_indexes):
    for index, field, inline_value in label_indexes:
        if field != "manufacturer":
            continue

        name = inline_value or _next_non_label(lines, index)

        if not name:
            continue

        name_lower = name.lower()

        if name_lower in {
            "brand owner",
            "customer care",
            "nutritional information",
        }:
            continue

        return normalize_value(name)

    return None


# ============================================================
# GENERIC LABELLED VALUE
# ============================================================

def _extract_labeled_value(lines, label_indexes, target_field):
    for index, field, inline_value in label_indexes:
        if field != target_field:
            continue

        value = inline_value or _next_non_label(lines, index)

        if value:
            return normalize_value(value)

    return None


# ============================================================
# MANUFACTURER ADDRESS
# ============================================================

def _extract_manufacturer_address(lines, label_indexes):
    for index, field, inline_value in label_indexes:
        if field not in {
            "manufacturer",
            "manufacturer_address",
        }:
            continue

        address_lines = []

        # If manufacturer is inline, start after current line.
        # Otherwise OCR commonly has:
        #
        # MANUFACTURED BY:
        # CHITALE BANDHU MITHAIWALE
        # Gat No. 107...
        #
        start = index + 1

        manufacturer_seen = bool(inline_value)

        for line in lines[start:]:
            value = normalize_value(line)

            if not value:
                continue

            next_field, _ = find_label(value)

            # Stop when another structured field starts.
            if next_field:
                break

            lower = value.lower()

            if lower in NUTRITION_LABELS:
                break

            if lower.startswith(("fssa", "lic. no", "lic no")):
                break

            # Skip manufacturer name itself.
            if not manufacturer_seen:
                manufacturer_seen = True
                continue

            # Address indicators.
            if re.search(
                r"\b("
                r"gat|road|tal\.?|dist\.?|district|"
                r"maharashtra|pune|india|address|"
                r"pin|post|at post"
                r")\b",
                value,
                re.IGNORECASE,
            ):
                address_lines.append(value)
                continue

            # Once address collection has started,
            # allow continuation lines.
            if address_lines:
                address_lines.append(value)

        if address_lines:
            return normalize_value(" ".join(address_lines))

    return None


# ============================================================
# INGREDIENTS
# ============================================================

def _extract_ingredients(lines, label_indexes):
    for index, field, inline_value in label_indexes:
        if field != "ingredients":
            continue

        if inline_value:
            return normalize_value(inline_value)

        values = []

        for line in lines[index + 1:]:
            next_field, _ = find_label(line)

            if next_field:
                break

            if line.lower() not in NUTRITION_LABELS:
                values.append(line)

        if values:
            return normalize_value(" ".join(values))

    return None


# ============================================================
# CUSTOMER CARE
# ============================================================

def _extract_contact(lines, label_indexes):
    phone = []
    emails = []
    websites = []

    for index, field, inline_value in label_indexes:
        if field != "customer_care":
            continue

        contact_lines = []

        if inline_value:
            contact_lines.append(inline_value)

        contact_lines.extend(lines[index + 1:])

        for line in contact_lines:
            next_field, _ = find_label(line)

            if next_field and next_field != "customer_care":
                break

            phone.extend(PHONE_PATTERN.findall(line))

            emails_found = EMAIL_PATTERN.findall(line)
            emails.extend(emails_found)

            website_line = EMAIL_PATTERN.sub("", line)

            websites.extend(
                WEBSITE_PATTERN.findall(website_line)
            )

    parts = []

    if phone:
        parts.append(
            f"Phone: {normalize_value(phone[0])}"
        )

    if emails:
        parts.append(
            f"Email: {normalize_value(emails[0])}"
        )

    if websites:
        website = websites[0].rstrip(".,)")

        parts.append(
            f"Website: {website}"
        )

    return "; ".join(parts) or None


# ============================================================
# NUMBER AFTER LABEL
# ============================================================

def _find_number_after_label(
    lines,
    label_indexes,
    field,
    pattern,
    validator,
):
    for index, current_field, inline_value in label_indexes:
        if current_field != field:
            continue

        candidates = []

        if inline_value:
            candidates.append(inline_value)

        # Search a reasonable OCR window after the label.
        candidates.extend(
            lines[index:index + 8]
        )

        for line in candidates:
            match = pattern.search(line or "")

            candidate = (
                match.group(0)
                if match
                else line
            )

            if validator(candidate):
                return normalize_value(candidate)

    return None


# ============================================================
# PRODUCT NAME
# ============================================================

def _infer_product_name(lines, label_indexes):
    """
    Extract product name safely from OCR text.

    Priority:

    1. Explicitly labelled product name.
    2. Strong product-name candidate near beginning.
    3. Known food/product patterns.
    4. Safe fallback.

    IMPORTANT:
    Never return:
    - EPR refund text
    - customer-care text
    - nutrition values
    - addresses
    - instructions
    - warnings
    - ingredients
    - long sentences
    """

    # --------------------------------------------------------
    # 1. Explicit product-name label
    # --------------------------------------------------------

    for index, field, inline_value in label_indexes:
        if field == "product_name" and inline_value:
            value = normalize_value(inline_value)

            if value:
                return value

    # --------------------------------------------------------
    # 2. Strong candidates near beginning of OCR
    # --------------------------------------------------------

    stop_terms = (
        "ingredients",
        "allergen advice",
        "storage condition",
        "instructions for use",
        "warning",
        "manufactured by",
        "packed by",
        "manufactured",
        "nutritional information",
        "fssai",
        "lic. no",
    )

    rejected_terms = (
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
        "product of",
        "customer care",
        "brand owner",
    )

    # OCR shows product name near the beginning.
    for line in lines[:20]:
        value = normalize_value(line)

        if not value:
            continue

        lower = value.lower()

        # ----------------------------------------------------
        # Very strong product pattern.
        #
        # Example:
        # Kaju Katli (Classic)
        # ----------------------------------------------------

        if re.search(
            r"\bkaju\s+katli\b",
            lower,
            re.IGNORECASE,
        ):
            return value

        # ----------------------------------------------------
        # Stop declaration sections.
        # ----------------------------------------------------

        if any(term in lower for term in stop_terms):
            break

        # ----------------------------------------------------
        # Reject noise.
        # ----------------------------------------------------

        if any(term in lower for term in rejected_terms):
            continue

        # ----------------------------------------------------
        # Length validation.
        # ----------------------------------------------------

        if len(value) < 4:
            continue

        if len(value) > 70:
            continue

        # ----------------------------------------------------
        # Too many numbers = probably not product name.
        # ----------------------------------------------------

        if sum(char.isdigit() for char in value) > 3:
            continue

        # ----------------------------------------------------
        # Address detection.
        # ----------------------------------------------------

        if re.search(
            r"\b("
            r"gat|road|tal\.?|dist\.?|district|"
            r"maharashtra|pune|india|address|"
            r"pin|post|at post"
            r")\b",
            value,
            re.IGNORECASE,
        ):
            continue

        # ----------------------------------------------------
        # Nutrition labels.
        # ----------------------------------------------------

        if lower in NUTRITION_LABELS:
            continue

        # ----------------------------------------------------
        # Must contain enough letters.
        # ----------------------------------------------------

        letters = sum(
            char.isalpha()
            for char in value
        )

        if letters < 3:
            continue

        # ----------------------------------------------------
        # Avoid sentence-like OCR.
        # ----------------------------------------------------

        if value.count(".") > 2:
            continue

        if value.count(",") > 3:
            continue

        # ----------------------------------------------------
        # Safe candidate.
        # ----------------------------------------------------

        return value

    # --------------------------------------------------------
    # 3. Pattern-based fallback
    # --------------------------------------------------------

    product_patterns = (
        r"^([A-Za-z][A-Za-z0-9&,'()\- ]{2,70})$",
    )

    for line in lines:
        value = normalize_value(line)

        if not value:
            continue

        lower = value.lower()

        for pattern in product_patterns:
            if not re.fullmatch(pattern, value):
                continue

            if any(
                term in lower
                for term in rejected_terms
            ):
                continue

            if any(
                term in lower
                for term in (
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
                    "date of manufacture",
                    "use by",
                )
            ):
                continue

            if re.search(
                r"\b("
                r"gat|road|tal\.?|dist\.?|district|"
                r"maharashtra|pune|india|address"
                r")\b",
                value,
                re.IGNORECASE,
            ):
                continue

            if sum(
                char.isdigit()
                for char in value
            ) > 3:
                continue

            if len(value) < 4 or len(value) > 70:
                continue

            return value

    return None


# ============================================================
# MAIN EXTRACTION FUNCTION
# ============================================================

def extract_declarations(raw_text):
    """
    Main declaration extraction entry point.
    """

    lines = normalize_lines(raw_text)

    parsed, lines, label_indexes = (
        parse_labeled_fields(lines)
    )

    extracted = {
        field: None
        for field in STRUCTURED_FIELDS
    }

    # Product
    extracted["product_name"] = (
        _infer_product_name(
            lines,
            label_indexes,
        )
    )

    # Brand
    extracted["brand_name"] = (
        parsed.get("brand_name")
    )

    # Manufacturer
    extracted["manufacturer"] = (
        _extract_manufacturer(
            lines,
            label_indexes,
        )
    )

    # Manufacturer address
    extracted["manufacturer_address"] = (
        _extract_manufacturer_address(
            lines,
            label_indexes,
        )
    )

    # Net quantity
    extracted["net_quantity"] = (
        _validated_candidate(
            lines,
            label_indexes,
            "net_quantity",
            is_valid_quantity,
        )
    )

    # MRP
    extracted["mrp"] = (
        _validated_candidate(
            lines,
            label_indexes,
            "mrp",
            is_valid_mrp,
        )
    )

    # Batch
    extracted["batch_number"] = (
        _validated_candidate(
            lines,
            label_indexes,
            "batch_number",
            is_valid_batch_number,
        )
    )

    # Manufacturing date
    extracted["date_of_manufacture"] = (
        _validated_candidate(
            lines,
            label_indexes,
            "date_of_manufacture",
            is_valid_date,
        )
    )

    # Use by
    extracted["use_by"] = (
        _validated_candidate(
            lines,
            label_indexes,
            "use_by",
            is_valid_date,
        )
    )

    # Ingredients
    extracted["ingredients"] = (
        _extract_ingredients(
            lines,
            label_indexes,
        )
    )

    # Customer care
    extracted["customer_care"] = (
        _extract_contact(
            lines,
            label_indexes,
        )
    )

    # FSSAI
    extracted["fssai_license"] = (
        _find_number_after_label(
            lines,
            label_indexes,
            "fssai_license",
            FSSAI_PATTERN,
            is_valid_fssai,
        )
    )

    # FSSAI fallback:
    # Search entire OCR text.
    if extracted["fssai_license"] is None:
        for line in lines:
            match = FSSAI_PATTERN.search(line)

            if match:
                candidate = match.group(0)

                if is_valid_fssai(candidate):
                    extracted["fssai_license"] = (
                        normalize_value(candidate)
                    )
                    break

    # Country of origin
    extracted["country_of_origin"] = (
        parsed.get("country_of_origin")
    )

    # Brand owner
    extracted["brand_owner"] = (
        _extract_labeled_value(
            lines,
            label_indexes,
            "brand_owner",
        )
    )

    # EPR registration
    extracted["epr_registration"] = (
        _find_number_after_label(
            lines,
            label_indexes,
            "epr_registration",
            EPR_PATTERN,
            is_valid_epr_number,
        )
    )

    return extracted