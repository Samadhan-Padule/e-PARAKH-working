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

        for offset in range(1, 8):

            if index + offset >= len(lines):
                break

            line = lines[index + offset]

            next_field, _ = find_label(line)

            if next_field and next_field != field:
                break

            candidates.append(line)

        for candidate in candidates:

            if validator(candidate):
                return normalize_value(candidate)

    return None


def _extract_labeled_value(lines, label_indexes, field):
    for index, current_field, inline_value in label_indexes:

        if current_field != field:
            continue

        if inline_value:
            return normalize_value(inline_value)

        value = _next_non_label(lines, index)

        if value:
            return normalize_value(value)

    return None


def _extract_manufacturer(lines, label_indexes):

    for index, field, inline_value in label_indexes:

        if field != "manufacturer":
            continue

        if inline_value:
            value = normalize_value(inline_value)

            if value:
                return value

        for line in lines[index + 1:index + 6]:

            next_field, _ = find_label(line)

            if next_field:
                break

            lower = line.lower()

            if lower in NUTRITION_LABELS:
                continue

            if "fssai" in lower or "license" in lower:
                continue

            if re.search(
                r"\b("
                r"office|survey|road|taluka|tal\.|district|dist\.|"
                r"pincode|pin|india|gujarat|maharashtra|"
                r"madhya pradesh|uttar pradesh"
                r")\b",
                line,
                re.IGNORECASE,
            ):
                continue

            if sum(c.isalpha() for c in line) >= 3:
                return normalize_value(line)

    return None


def _extract_manufacturer_address(lines, label_indexes):

    for index, field, inline_value in label_indexes:

        if field not in {
            "manufacturer",
            "manufacturer_address",
        }:
            continue

        address_lines = []

        start = index + 1

        if field == "manufacturer" and inline_value:
            start = index + 1

        for line in lines[start:]:

            next_field, _ = find_label(line)

            if next_field and next_field != "manufacturer":
                break

            lower = line.lower()

            if lower in NUTRITION_LABELS:
                break

            if "website:" in lower:
                break

            if "consumer care" in lower:
                break

            if re.search(
                r"\b("
                r"office|survey\s*no|plot\s*no|road|tal\.?|taluka|"
                r"dist\.?|district|industrial|estate|phase|"
                r"pincode|pin\s*code|india|gujarat|maharashtra|"
                r"madhya\s+pradesh|uttar\s+pradesh"
                r")\b",
                line,
                re.IGNORECASE,
            ):
                address_lines.append(line)

                if len(address_lines) >= 5:
                    break

                continue

            if address_lines:
                address_lines.append(line)

                if len(address_lines) >= 5:
                    break

        if address_lines:
            return normalize_value(" ".join(address_lines))

    return None


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

            if line.lower() in NUTRITION_LABELS:
                break

            values.append(line)

        if values:
            return normalize_value(" ".join(values))

    return None


def _extract_customer_care(lines, label_indexes):

    phones = []
    emails = []
    websites = []

    for index, field, inline_value in label_indexes:

        if field != "customer_care":
            continue

        contact_lines = []

        if inline_value:
            contact_lines.append(inline_value)

        contact_lines.extend(lines[index:index + 12])

        for line in contact_lines:

            phones.extend(PHONE_PATTERN.findall(line))
            emails.extend(EMAIL_PATTERN.findall(line))

            cleaned = EMAIL_PATTERN.sub("", line)

            websites.extend(
                WEBSITE_PATTERN.findall(cleaned)
            )

    parts = []

    if phones:
        parts.append(
            f"Phone: {normalize_value(phones[0])}"
        )

    if emails:
        parts.append(
            f"Email: {normalize_value(emails[0])}"
        )

    if websites:
        website = normalize_value(
            websites[0].rstrip(".,)")
        )

        parts.append(
            f"Website: {website}"
        )

    return "; ".join(parts) or None


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

        candidates.extend(
            lines[index:index + 10]
        )

        for line in candidates:

            match = pattern.search(line)

            if match:
                candidate = match.group(0)
            else:
                candidate = line

            if validator(candidate):
                return normalize_value(candidate)

    return None


def _infer_product_name(lines, label_indexes):

    # Explicit product label has highest priority.
    explicit = _extract_labeled_value(
        lines,
        label_indexes,
        "product_name",
    )

    if explicit:
        return explicit

    forbidden = (
        "nutritional information",
        "ingredients",
        "manufactured by",
        "manufacturing",
        "fssai",
        "license",
        "mrp",
        "batch",
        "expiry",
        "packed",
        "pkd",
        "customer care",
        "consumer care",
        "website",
        "product of",
        "address",
        "office",
        "survey",
        "road",
        "india",
    )

    for line in lines[:20]:

        value = normalize_value(line)

        if not value:
            continue

        lower = value.lower()

        if any(
            word in lower
            for word in forbidden
        ):
            continue

        if lower in NUTRITION_LABELS:
            continue

        if sum(c.isdigit() for c in value) > 3:
            continue

        if len(value) < 4 or len(value) > 80:
            continue

        if sum(c.isalpha() for c in value) < 3:
            continue

        if re.fullmatch(
            r"[A-Za-z][A-Za-z0-9&,'()\- ]{2,79}",
            value,
        ):
            return value

    return None


def _fallback_batch_number(lines):

    for line in lines:

        value = normalize_value(line)

        if not value:
            continue

        if is_valid_batch_number(value):
            return value

    return None


def _fallback_dates(lines):

    manufacture = None
    expiry = None

    for line in lines:

        value = normalize_value(line)

        if not value:
            continue

        if is_valid_date(value):

            if manufacture is None:
                manufacture = value

            elif expiry is None:
                expiry = value

    return manufacture, expiry


def extract_declarations(raw_text):

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
        _extract_labeled_value(
            lines,
            label_indexes,
            "brand_name",
        )
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

    if not extracted["batch_number"]:
        extracted["batch_number"] = (
            _fallback_batch_number(lines)
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

    # Use by / expiry
    extracted["use_by"] = (
        _validated_candidate(
            lines,
            label_indexes,
            "use_by",
            is_valid_date,
        )
    )

    # Date fallback
    if (
        not extracted["date_of_manufacture"]
        or not extracted["use_by"]
    ):
        manufacture, expiry = _fallback_dates(lines)

        if not extracted["date_of_manufacture"]:
            extracted["date_of_manufacture"] = manufacture

        if not extracted["use_by"]:
            extracted["use_by"] = expiry

    # Ingredients
    extracted["ingredients"] = (
        _extract_ingredients(
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

    if not extracted["fssai_license"]:

        for line in lines:

            match = FSSAI_PATTERN.search(line)

            if match:
                extracted["fssai_license"] = (
                    normalize_value(
                        match.group(0)
                    )
                )
                break

    # Country
    extracted["country_of_origin"] = (
        _extract_labeled_value(
            lines,
            label_indexes,
            "country_of_origin",
        )
    )

    # Customer care
    extracted["customer_care"] = (
        _extract_customer_care(
            lines,
            label_indexes,
        )
    )

    # Brand owner
    extracted["brand_owner"] = (
        _extract_labeled_value(
            lines,
            label_indexes,
            "brand_owner",
        )
    )

    # EPR
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