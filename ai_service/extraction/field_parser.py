import re


# ============================================================
# FIELD LABELS
# ============================================================

FIELD_LABELS = {

    # --------------------------------------------------------
    # MANUFACTURER / PACKER / IMPORTER
    # --------------------------------------------------------

    "manufacturer": re.compile(
        r"^\s*(?:"
        r"manufactured\s+and\s+marketed\s+by|"
        r"marketed\s+and\s+manufactured\s+by|"
        r"manufactured\s+by|"
        r"manufactured\s+at|"
        r"manufactured|"
        r"manufacturer|"
        r"packed\s+by|"
        r"packed\s+at|"
        r"imported\s+by|"
        r"importer|"
        r"marketed\s+by"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # MANUFACTURER ADDRESS
    # --------------------------------------------------------

    "manufacturer_address": re.compile(
        r"^\s*(?:"
        r"manufacturer\s+address|"
        r"manufacturing\s+address|"
        r"address\s+of\s+manufacturer|"
        r"registered\s+office|"
        r"office\s+address"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # NET QUANTITY
    # --------------------------------------------------------

    "net_quantity": re.compile(
        r"^\s*(?:"
        r"net\s+(?:quantity|weight|wt|content|qty)|"
        r"net\s+wt|"
        r"net\s+weight|"
        r"net\s+content|"
        r"net\s+qty|"
        r"quantity|"
        r"qty|"
        r"weight"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # MRP
    # --------------------------------------------------------

    "mrp": re.compile(
        r"^\s*(?:"
        r"mrp|"
        r"m\.?\s*r\.?\s*p\.?|"
        r"maximum\s+retail\s+price"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # BATCH / LOT
    # --------------------------------------------------------

    "batch_number": re.compile(
        r"^\s*(?:"
        r"batch\s*(?:no\.?|number|num)?|"
        r"batch\s*code|"
        r"batch\s*id|"
        r"b\.?\s*no\.?|"
        r"lot\s*(?:no\.?|number|num)?|"
        r"lot\s*code"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # DATE OF MANUFACTURE / PACKING
    # --------------------------------------------------------

    "date_of_manufacture": re.compile(
        r"^\s*(?:"
        r"date\s+of\s+(?:manufacture|mfg|packing|packaging)|"
        r"date\s+of\s+mfg|"
        r"mfg\s+date|"
        r"mfd\s+date|"
        r"manufactured\s+on|"
        r"manufactured\s+date|"
        r"packed\s+on|"
        r"packed\s+date|"
        r"packing\s+date|"
        r"pkd\.?|"
        r"mfg\.?"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # USE BY / EXPIRY
    # --------------------------------------------------------

    "use_by": re.compile(
        r"^\s*(?:"
        r"use\s+by|"
        r"use\s+before|"
        r"best\s+before|"
        r"best\s+by|"
        r"expiry|"
        r"expiry\s+date|"
        r"expiration\s+date|"
        r"expires\s+on|"
        r"exp\.?|"
        r"exp\s+date"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # INGREDIENTS
    # --------------------------------------------------------

    "ingredients": re.compile(
        r"^\s*(?:"
        r"ingredients|"
        r"ingredient|"
        r"composition|"
        r"contents"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # FSSAI
    # --------------------------------------------------------

    "fssai_license": re.compile(
        r"^\s*(?:"
        r"fssai\s+license|"
        r"fssai\s+licence|"
        r"fssai|"
        r"food\s+safety\s+license|"
        r"food\s+safety\s+licence|"
        r"lic\.?\s*(?:no\.?|number|num)?|"
        r"license\s+no\.?|"
        r"licence\s+no\.?"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # COUNTRY OF ORIGIN
    # --------------------------------------------------------

    "country_of_origin": re.compile(
        r"^\s*(?:"
        r"country\s+of\s+origin|"
        r"country\s+origin|"
        r"made\s+in|"
        r"product\s+of"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # CUSTOMER CARE
    # --------------------------------------------------------

    "customer_care": re.compile(
        r"^\s*(?:"
        r"consumer\s+care|"
        r"customer\s+care|"
        r"customer\s+service|"
        r"customer\s+care\s+representative|"
        r"consumer\s+complaints|"
        r"consumer\s+complaint|"
        r"complaints|"
        r"helpline|"
        r"help\s*line|"
        r"toll\s*free|"
        r"contact\s+us|"
        r"contact"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # BRAND OWNER
    # --------------------------------------------------------

    "brand_owner": re.compile(
        r"^\s*(?:"
        r"brand\s+owner(?:\s*&\s*marketed\s+by)?|"
        r"a\s+product\s+of|"
        r"owned\s+by|"
        r"brand\s+owned\s+by"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # EPR
    # --------------------------------------------------------

    "epr_registration": re.compile(
        r"^\s*epr"
        r"(?:"
        r"\s+registration|"
        r"\s+reg|"
        r"\s+reg\.?|"
        r"\s+registration\s+no\.?|"
        r"\s+registration\s+number|"
        r"\s+reg\s+no\.?|"
        r"\s+reg\s+number|"
        r"\s+no\.?|"
        r"\s+number"
        r")?"
        r"\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # PRODUCT NAME
    # --------------------------------------------------------

    "product_name": re.compile(
        r"^\s*(?:"
        r"product\s+name|"
        r"name\s+of\s+product|"
        r"product|"
        r"commodity"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),

    # --------------------------------------------------------
    # BRAND NAME
    # --------------------------------------------------------

    "brand_name": re.compile(
        r"^\s*(?:"
        r"brand\s+name|"
        r"brand"
        r")\s*[:\-]?\s*(.*)$",
        re.IGNORECASE,
    ),
}


# ============================================================
# NUTRITION / NON-DECLARATION LABELS
# ============================================================

NUTRITION_LABELS = {
    "nutritional information",
    "nutrition information",
    "nutrition facts",
    "nutrition",
    "serving size",
    "servings per package",
    "servings per pack",
    "energy",
    "protein",
    "total fat",
    "saturated fat",
    "trans fat",
    "cholesterol",
    "carbohydrates",
    "carbohydrate",
    "dietary fiber",
    "total dietary fiber",
    "total sugar",
    "total sugars",
    "added sugar",
    "added sugars",
    "sodium",
    "calories",
    "kcal",
    "calcium",
    "iron",
    "vitamin a",
    "vitamin c",
    "vitamin d",
    "moisture",
    "ash",
    "monounsaturated fat",
    "polyunsaturated fat",
    "fatty acid",
}


# ============================================================
# OCR NORMALIZATION
# ============================================================

OCR_NOISE_REPLACEMENTS = {

    # Rupee symbol OCR corruption
    "Γé╣": "₹",
    "â‚¹": "₹",
    "Â₹": "₹",
    "â‚": "₹",

    # Common INDIA OCR errors
    "INUIA": "INDIA",
    "INDlA": "INDIA",
    "lNDIA": "INDIA",

    # Full-width MRP
    "ＭＲＰ": "MRP",
    "ｍｒｐ": "mrp",

    # Unicode colon variants
    "：": ":",
    "﹕": ":",
    "꞉": ":",
    "∶": ":",

    # OCR garbage around punctuation
    "∩╝Ü": ":",
    "∩╣ò": ":",
}


# ============================================================
# REGEX PATTERNS
# ============================================================

# ------------------------------------------------------------
# DATE
# ------------------------------------------------------------

DATE_PATTERN = re.compile(
    r"^\s*(?:"

    # DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    r"\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|"

    # MM/YYYY
    r"\d{1,2}[-/.]\d{2,4}|"

    # DD MON YYYY
    r"\d{1,2}\s+"
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
    r"[a-z]*\s+\d{2,4}|"

    # MON YYYY
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
    r"[a-z]*\s+\d{2,4}|"

    # DDMMMYYYY
    r"\d{1,2}[a-z]{3}\d{2,4}"

    r")\s*$",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# MRP
# ------------------------------------------------------------

MRP_PATTERN = re.compile(
    r"^\s*"
    r"(?:"
        r"₹\s*"
        r"|"
        r"rs\.?\s*"
        r"|"
        r"inr\s*"
    ")?"

    r"\d+(?:[,.]\d{1,2})?"

    r"\s*"

    r"(?:"
        r"rs\.?"
        r"|"
        r"₹"
    ")?"

    r"\s*"

    r"(?:"
        r"\(?\s*"
        r"(?:incl\.?|including)"
        r"\s*(?:of\s*)?"
        r"(?:all\s*)?"
        r"tax(?:es)?"
        r"\s*\)?"
    ")?"

    # Support common OCR / package form: 500/-
    r"\s*(?:/-)?"

    r"\s*$",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# QUANTITY
# ------------------------------------------------------------

QUANTITY_PATTERN = re.compile(
    r"^\s*"
    r"\d+(?:[.,]\d+)?"
    r"\s*"
    r"(?:"
        r"g|kg|mg|mcg|µg|ug|"
        r"ml|cl|l|ltr|litre|litres|"
        r"lb|lbs|oz"
    r")"
    r"\.?"
    r"\s*$",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# BATCH NUMBER
# ------------------------------------------------------------

BATCH_PATTERN = re.compile(
    r"^\s*"
    r"[A-Z0-9][A-Z0-9/\-]{2,30}"
    r"\s*$",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# PHONE
# ------------------------------------------------------------

PHONE_PATTERN = re.compile(
    r"(?:"
    r"\+?91[\s-]?\d{5}[\s-]?\d{5}|"
    r"\+\d{10,12}|"
    r"\d{3,5}[\s-]\d{5,8}|"
    r"\d[\d ()-]{7,}\d"
    r")"
)


# ------------------------------------------------------------
# EMAIL
# ------------------------------------------------------------

EMAIL_PATTERN = re.compile(
    r"\b"
    r"[A-Z0-9._%+-]+"
    r"@"
    r"[A-Z0-9.-]+"
    r"\."
    r"[A-Z]{2,}"
    r"\b",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# WEBSITE
# ------------------------------------------------------------

WEBSITE_PATTERN = re.compile(
    r"(?<![@A-Z0-9._%+-])"
    r"(?:https?://)?"
    r"(?:www\.)?"
    r"[A-Z0-9-]+"
    r"(?:\.[A-Z0-9-]+)+"
    r"(?:/[^\s]*)?"
    r"\b",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# FSSAI
# ------------------------------------------------------------

FSSAI_PATTERN = re.compile(
    r"\b\d{14}\b"
)


# ------------------------------------------------------------
# EPR
# ------------------------------------------------------------

EPR_PATTERN = re.compile(
    r"\b(?:"
    r"[A-Z0-9]{2,}(?:[-/][A-Z0-9]+){1,}"
    r"|"
    r"\d{10,20}"
    r")\b",
    re.IGNORECASE,
)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_value(value):
    """
    Normalize OCR value.

    - Converts OCR corruption
    - Normalizes whitespace
    - Removes surrounding punctuation
    """

    if value is None:
        return None

    value = str(value)

    for old, new in OCR_NOISE_REPLACEMENTS.items():
        value = value.replace(old, new)

    value = re.sub(r"\s+", " ", value)

    return value.strip(" \t:;\n") or None


def normalize_lines(raw_text):
    """
    Convert OCR text into clean non-empty lines.
    """

    if isinstance(raw_text, str):

        result = []

        for line in raw_text.splitlines():

            normalized = normalize_value(line)

            if normalized:
                result.append(normalized)

        return result

    if isinstance(raw_text, (list, tuple)):

        result = []

        for line in raw_text:

            normalized = normalize_value(line)

            if normalized:
                result.append(normalized)

        return result

    return []


# ============================================================
# MATCHING
# ============================================================

def _matches(pattern, value):

    normalized = normalize_value(value)

    if not normalized:
        return False

    return bool(
        pattern.search(normalized)
    )


# ============================================================
# VALIDATORS
# ============================================================

def is_valid_mrp(value):
    """
    Validate MRP values such as:

        50
        50 Rs.
        Rs. 50
        ₹50
        ₹ 50
        50 ₹
        500/-
        50 Rs. (Incl. Of All Taxes)
    """

    value = normalize_value(value)

    if not value:
        return False

    cleaned = re.sub(
        r"\b(?:mrp|maximum\s+retail\s+price)\b\s*[:\-]?",
        "",
        value,
        flags=re.IGNORECASE,
    ).strip()

    cleaned = re.sub(
        r"\s*\(?\s*(?:incl\.?|including)"
        r"\s*(?:of\s*)?(?:all\s*)?"
        r"tax(?:es)?\s*\)?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()

    return bool(
        MRP_PATTERN.fullmatch(cleaned)
        and re.search(r"\d", cleaned)
    )


def is_valid_quantity(value):

    value = normalize_value(value)

    if not value:
        return False

    return bool(
        QUANTITY_PATTERN.fullmatch(value)
    )


def is_valid_date(value):

    value = normalize_value(value)

    if not value:
        return False

    return bool(
        DATE_PATTERN.fullmatch(value)
    )


def is_valid_batch_number(value):
    """
    Validate batch / lot number.

    Accepts:
    - ABC123
    - BATCH2026
    - LOT-123
    - LOT/123
    - 12345678901

    Rejects:
    - quantities
    - dates
    - nutrition labels
    - values containing spaces
    - empty values

    Numeric-only values are intentionally allowed.
    """

    value = normalize_value(value)

    if not value:
        return False

    lower = value.lower()

    # Never classify nutrition labels as batch numbers
    if lower in NUTRITION_LABELS:
        return False

    # Never classify quantities as batch numbers
    if is_valid_quantity(value):
        return False

    # Never classify dates as batch numbers
    if is_valid_date(value):
        return False

    # Batch numbers should not contain spaces
    if " " in value:
        return False

    # Accept numeric, alphanumeric, / and - batch numbers
    return bool(
        BATCH_PATTERN.fullmatch(value)
    )


def is_valid_phone(value):

    if not value:
        return False

    return bool(
        PHONE_PATTERN.search(str(value))
    )


def is_valid_email(value):

    if not value:
        return False

    return bool(
        EMAIL_PATTERN.search(str(value))
    )


def is_valid_website(value):

    if not value:
        return False

    return bool(
        WEBSITE_PATTERN.search(str(value))
    )


def is_valid_fssai(value):

    if not value:
        return False

    return bool(
        FSSAI_PATTERN.search(str(value))
    )


def is_valid_epr_number(value):

    if not value:
        return False

    value = normalize_value(value)

    # FSSAI number should not be classified as EPR
    if FSSAI_PATTERN.fullmatch(value):
        return False

    return bool(
        EPR_PATTERN.search(value)
    )


# ============================================================
# LABEL DETECTION
# ============================================================

def find_label(line):

    normalized_line = normalize_value(line)

    if not normalized_line:
        return None, None

    # More specific labels first.
    field_order = (
        "manufacturer_address",
        "date_of_manufacture",
        "country_of_origin",
        "customer_care",
        "brand_owner",
        "epr_registration",
        "fssai_license",
        "batch_number",
        "net_quantity",
        "ingredients",
        "use_by",
        "manufacturer",
        "mrp",
        "product_name",
        "brand_name",
    )

    for field in field_order:

        pattern = FIELD_LABELS[field]

        match = pattern.match(
            normalized_line
        )

        if match:

            inline_value = normalize_value(
                match.group(1)
            )

            return field, inline_value

    return None, None


# ============================================================
# PARSE LABELLED FIELDS
# ============================================================

def parse_labeled_fields(raw_text):
    """
    Parse labelled package declarations from OCR text.

    Handles:

    - inline values
    - multiline values
    - OCR noise
    - nutrition values
    - numeric batch numbers
    - MRP with Rs / ₹ / /-
    """

    lines = normalize_lines(raw_text)

    parsed = {
        field: None
        for field in FIELD_LABELS
    }

    label_indexes = []

    # --------------------------------------------------------
    # FIND LABELS
    # --------------------------------------------------------

    for index, line in enumerate(lines):

        field, inline_value = find_label(line)

        if not field:
            continue

        label_indexes.append(
            (
                index,
                field,
                inline_value,
            )
        )

        # ----------------------------------------------------
        # INLINE VALUE
        # ----------------------------------------------------

        if inline_value:

            parsed[field] = inline_value

            continue

        # ----------------------------------------------------
        # MULTI-LINE VALUE
        # ----------------------------------------------------

        collected = []

        for next_index in range(
            index + 1,
            min(index + 6, len(lines)),
        ):

            next_line = lines[next_index]

            next_field, _ = find_label(
                next_line
            )

            # Stop at another declaration
            if next_field:
                break

            # Stop at nutrition heading
            if next_line.lower() in NUTRITION_LABELS:
                break

            collected.append(
                next_line
            )

        if collected:

            parsed[field] = normalize_value(
                " ".join(collected)
            )

    # ========================================================
    # VALIDATION
    # ========================================================

    # --------------------------------------------------------
    # BATCH
    # --------------------------------------------------------

    if parsed.get("batch_number"):

        batch = normalize_value(
            parsed["batch_number"]
        )

        if not is_valid_batch_number(batch):

            parsed["batch_number"] = None

    # --------------------------------------------------------
    # MRP
    # --------------------------------------------------------

    if parsed.get("mrp"):

        if not is_valid_mrp(
            parsed["mrp"]
        ):

            parsed["mrp"] = None

    # --------------------------------------------------------
    # NET QUANTITY
    # --------------------------------------------------------

    if parsed.get("net_quantity"):

        if not is_valid_quantity(
            parsed["net_quantity"]
        ):

            parsed["net_quantity"] = None

    # --------------------------------------------------------
    # MANUFACTURING DATE
    # --------------------------------------------------------

    if parsed.get("date_of_manufacture"):

        if not is_valid_date(
            parsed["date_of_manufacture"]
        ):

            parsed["date_of_manufacture"] = None

    # --------------------------------------------------------
    # USE BY
    # --------------------------------------------------------

    if parsed.get("use_by"):

        if not is_valid_date(
            parsed["use_by"]
        ):

            parsed["use_by"] = None

    # --------------------------------------------------------
    # FSSAI
    # --------------------------------------------------------

    if parsed.get("fssai_license"):

        match = FSSAI_PATTERN.search(
            parsed["fssai_license"]
        )

        if match:

            parsed["fssai_license"] = (
                match.group(0)
            )

        else:

            parsed["fssai_license"] = None

    # --------------------------------------------------------
    # EPR
    # --------------------------------------------------------

    if parsed.get("epr_registration"):

        epr_value = normalize_value(
            parsed["epr_registration"]
        )

        match = EPR_PATTERN.search(
            epr_value
        )

        if match:

            candidate = match.group(0)

            if is_valid_epr_number(
                candidate
            ):

                parsed["epr_registration"] = (
                    normalize_value(candidate)
                )

            else:

                parsed["epr_registration"] = None

        else:

            parsed["epr_registration"] = None

    return (
        parsed,
        lines,
        label_indexes,
    )