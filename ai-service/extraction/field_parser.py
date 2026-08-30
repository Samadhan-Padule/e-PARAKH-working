import re


# ============================================================
# FIELD LABELS
# ============================================================

FIELD_LABELS = {

    "manufacturer": re.compile(
        r"^\s*(?:"
        r"manufactured\s+by|"
        r"manufactured|"
        r"manufacturer|"
        r"packed\s+by|"
        r"packed\s+at|"
        r"imported\s+by|"
        r"importer|"
        r"marketed\s+by|"
        r"marketed\s+and\s+manufactured\s+by"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "manufacturer_address": re.compile(
        r"^\s*(?:"
        r"manufacturer\s+address|"
        r"manufacturing\s+address|"
        r"address\s+of\s+manufacturer|"
        r"registered\s+office"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "net_quantity": re.compile(
        r"^\s*(?:"
        r"net\s+(?:quantity|weight|wt|content)|"
        r"net\s+wt|"
        r"net\s+weight|"
        r"net\s+content|"
        r"quantity|"
        r"weight"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "mrp": re.compile(
        r"^\s*(?:"
        r"mrp|"
        r"m\.?\s*r\.?\s*p\.?|"
        r"maximum\s+retail\s+price|"
        r"max(?:imum)?\s+retail\s+price"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "batch_number": re.compile(
        r"^\s*(?:"
        r"batch\s*(?:no\.?|number)?|"
        r"b\.?\s*no\.?|"
        r"lot\s*(?:no\.?|number)?|"
        r"lot"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

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
        r"pkd\.?"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

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
        r"exp\.?"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "ingredients": re.compile(
        r"^\s*(?:"
        r"ingredients|"
        r"ingredient|"
        r"composition|"
        r"contents"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "fssai_license": re.compile(
        r"^\s*(?:"
        r"fssai|"
        r"fssai\s+license|"
        r"fssai\s+licence|"
        r"lic\.?\s*(?:no\.?|ence|ense|number)?|"
        r"license\s+no\.?|"
        r"licence\s+no\.?"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "country_of_origin": re.compile(
        r"^\s*(?:"
        r"country\s+of\s+origin|"
        r"made\s+in|"
        r"product\s+of|"
        r"country\s+origin"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "customer_care": re.compile(
        r"^\s*(?:"
        r"consumer\s+care|"
        r"customer\s+care|"
        r"customer\s+service|"
        r"customer\s+care\s+representative|"
        r"consumer\s+complaints|"
        r"complaints|"
        r"helpline|"
        r"help\s*line|"
        r"toll\s*free|"
        r"contact\s+us"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "brand_owner": re.compile(
        r"^\s*(?:"
        r"brand\s+owner|"
        r"a\s+product\s+of|"
        r"owned\s+by|"
        r"brand\s+owned\s+by"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "epr_registration": re.compile(
        r"^\s*"
        r"epr"
        r"(?:\s+reg(?:istration)?\.?)?"
        r"(?:\s+(?:no\.?|number))?"
        r"\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "product_name": re.compile(
        r"^\s*(?:"
        r"product\s+name|"
        r"name\s+of\s+product|"
        r"product|"
        r"commodity"
        r")\s*[:\-：]?\s*(.*)$",
        re.IGNORECASE,
    ),

    "brand_name": re.compile(
        r"^\s*(?:"
        r"brand\s+name|"
        r"brand"
        r")\s*[:\-：]?\s*(.*)$",
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
    "serving size",
    "servings per package",
    "energy",
    "protein",
    "total fat",
    "saturated fat",
    "trans fat",
    "cholesterol",
    "carbohydrates",
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
    "Γé╣": "₹",
    "â‚¹": "₹",
    "Â₹": "₹",
    "â‚": "₹",

    "INUIA": "INDIA",
    "INDlA": "INDIA",
    "lNDIA": "INDIA",

    "ＭＲＰ": "MRP",
    "ｍｒｐ": "mrp",

    "：": ":",
    "﹕": ":",
    "꞉": ":",
}


# ============================================================
# REGEX PATTERNS
# ============================================================

DATE_PATTERN = re.compile(
    r"^\s*(?:"
    r"\d{1,2}[\-/\.]\d{1,2}[\-/\.]\d{2,4}|"
    r"\d{1,2}[\-/\.]\d{2,4}|"
    r"\d{1,2}\s+"
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
    r"[a-z]*\s+\d{2,4}|"
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
    r"[a-z]*\s+\d{2,4}|"
    r"\d{1,2}[a-z]{3}\d{2,4}"
    r")\s*$",
    re.IGNORECASE,
)


MRP_PATTERN = re.compile(
    r"^\s*(?:₹|rs\.?|inr)?\s*"
    r"\d+(?:[,.]\d{1,2})?"
    r"(?:\s*(?:incl\.?|including)"
    r"\s*(?:of\s*)?(?:all\s*)?"
    r"tax(?:es)?)?"
    r"\s*$",
    re.IGNORECASE,
)


QUANTITY_PATTERN = re.compile(
    r"^\s*"
    r"\d+(?:[.,]\d+)?"
    r"\s*"
    r"(?:"
    r"g|kg|mg|mcg|ml|cl|l|ltr|litre|litres|"
    r"lb|lbs|oz"
    r")"
    r"\.?\s*$",
    re.IGNORECASE,
)


BATCH_PATTERN = re.compile(
    r"^\s*"
    r"(?=[A-Z0-9][A-Z0-9/\-]{2,}$)"
    r"(?=.*[A-Z])"
    r"(?=.*\d)"
    r"[A-Z0-9/\-]+"
    r"\s*$",
    re.IGNORECASE,
)


PHONE_PATTERN = re.compile(
    r"(?:"
    r"\+?91[\s\-]?"
    r"\d{5}[\s\-]?\d{5}|"
    r"\+?\d{10,12}|"
    r"\d{3,5}[\s\-]\d{5,8}|"
    r"\d[\d ()\-]{7,}\d"
    r")"
)


EMAIL_PATTERN = re.compile(
    r"\b"
    r"[A-Z0-9._%+\-]+"
    r"@"
    r"[A-Z0-9.\-]+"
    r"\."
    r"[A-Z]{2,}"
    r"\b",
    re.IGNORECASE,
)


WEBSITE_PATTERN = re.compile(
    r"(?<![@A-Z0-9._%+\-])"
    r"(?:https?://)?"
    r"(?:www\.)?"
    r"[A-Z0-9-]+"
    r"(?:\.[A-Z0-9-]+)+"
    r"(?:/[^\s]*)?"
    r"\b",
    re.IGNORECASE,
)


FSSAI_PATTERN = re.compile(
    r"\b\d{14}\b"
)


EPR_PATTERN = re.compile(
    r"\b[A-Z0-9]{2,}"
    r"(?:[-/][A-Z0-9]+){2,}"
    r"\b",
    re.IGNORECASE,
)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_value(value):
    if value is None:
        return None

    value = str(value)

    for old, new in OCR_NOISE_REPLACEMENTS.items():
        value = value.replace(old, new)

    value = re.sub(r"\s+", " ", value)

    return value.strip(" \t:;-\n") or None


def normalize_lines(raw_text):

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

    return bool(pattern.search(normalized))


# ============================================================
# VALIDATORS
# ============================================================

def is_valid_mrp(value):

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


def is_valid_batch_number(value):

    value = normalize_value(value)

    if not value:
        return False

    if value.lower() in NUTRITION_LABELS:
        return False

    if is_valid_date(value):
        return False

    return bool(
        BATCH_PATTERN.fullmatch(value)
    )


def is_valid_date(value):

    value = normalize_value(value)

    if not value:
        return False

    return bool(
        DATE_PATTERN.fullmatch(value)
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

    return bool(
        EPR_PATTERN.search(str(value))
    )


# ============================================================
# LABEL DETECTION
# ============================================================

def find_label(line):

    normalized_line = normalize_value(line)

    if not normalized_line:
        return None, None

    for field, pattern in FIELD_LABELS.items():

        match = pattern.match(normalized_line)

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

    lines = normalize_lines(raw_text)

    parsed = {
        field: None
        for field in FIELD_LABELS
    }

    label_indexes = []

    for index, line in enumerate(lines):

        field, inline_value = find_label(line)

        if field:

            label_indexes.append(
                (
                    index,
                    field,
                    inline_value,
                )
            )

            if inline_value:
                parsed[field] = inline_value

    return (
        parsed,
        lines,
        label_indexes,
    )