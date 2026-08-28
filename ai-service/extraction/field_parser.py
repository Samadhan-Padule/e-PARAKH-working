import re


FIELD_LABELS = {
    "manufacturer": re.compile(r"^\s*(?:manufactured\s+by|manufacturer|packed\s+by|imported\s+by|marketed\s+by)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "manufacturer_address": re.compile(r"^\s*(?:manufacturer\s+address|manufacturing\s+address|address\s+of\s+manufacturer)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "net_quantity": re.compile(r"^\s*(?:net\s+(?:quantity|weight|wt)|quantity)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "mrp": re.compile(r"^\s*(?:mrp|maximum\s+retail\s+price)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "batch_number": re.compile(r"^\s*(?:batch\s*(?:no\.?|number)?|lot\s*no\.?)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "date_of_manufacture": re.compile(r"^\s*(?:date\s+of\s+(?:manufacture|mfg|packing)|mfg\s+date|manufactured\s+on|packed\s+on)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "use_by": re.compile(r"^\s*(?:use\s+by|best\s+before|expiry(?:\s+date)?|expires\s+on)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "ingredients": re.compile(r"^\s*(?:ingredients|composition)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "fssai_license": re.compile(r"^\s*(?:fssai|lic\.?\s*(?:no\.?|ence|ense))\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "country_of_origin": re.compile(r"^\s*(?:country\s+of\s+origin|made\s+in|product\s+of)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "customer_care": re.compile(r"^\s*(?:consumer\s+care|customer\s+care|customer\s+service|customer\s+care\s+representative|helpline|toll\s*free)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "brand_owner": re.compile(r"^\s*(?:brand\s+owner|a\s+product\s+of|owned\s+by)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "epr_registration": re.compile(r"^\s*epr(?:\s+reg(?:istration)?\.?)?(?:\s+no\.?)?\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "product_name": re.compile(r"^\s*(?:product\s+name|name\s+of\s+product|product|commodity)\s*[:\-]?\s*(.*)$", re.IGNORECASE),
    "brand_name": re.compile(r"^\s*brand\s+name\s*[:\-]?\s*(.*)$", re.IGNORECASE),
}

NUTRITION_LABELS = {
    "nutritional information", "serving size", "energy", "total fat", "saturated fat",
    "trans fat", "cholesterol", "carbohydrates", "dietary fiber", "total sugar",
    "- incl. of added sugar", "incl. of added sugar", "protein", "sodium",
    "monounsaturated fat fatty acid", "polyunsaturated fat fatty acid",
}

DATE_PATTERN = re.compile(r"^\s*(?:\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4}|\d{1,2}[\-/]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\s*$", re.IGNORECASE)
MRP_PATTERN = re.compile(r"(?:₹|rs\.?|inr)\s*\d+(?:[,.]\d{1,2})?|^\d+(?:[,.]\d{1,2})\s*$", re.IGNORECASE)
QUANTITY_PATTERN = re.compile(r"^\s*\d+(?:[.,]\d+)?\s*(?:g|kg|mg|ml|l|ltr|litre|litres|lb|oz)\.?\s*$", re.IGNORECASE)
BATCH_PATTERN = re.compile(r"^\s*(?=[A-Z0-9][A-Z0-9/\-]{3,}$)(?=.*[A-Z])(?=.*\d)[A-Z0-9/\-]+\s*$", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d ()\-]{7,}\d)")
EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b", re.IGNORECASE)
WEBSITE_PATTERN = re.compile(r"(?<![@A-Z0-9._%+\-])(?:https?://)?(?:www\.)?[A-Z0-9-]+(?:\.[A-Z0-9-]+)+(?:/[^\s]*)?\b", re.IGNORECASE)
FSSAI_PATTERN = re.compile(r"\b\d{14}\b")
EPR_PATTERN = re.compile(r"\b[A-Z0-9]{2,}(?:-[A-Z0-9]+){3,}\b", re.IGNORECASE)


def normalize_value(value):
    if value is None:
        return None
    value = re.sub(r"\s+", " ", str(value)).strip(" \t:;-\n")
    return value or None


def normalize_lines(raw_text):
    if isinstance(raw_text, str):
        return [normalize_value(line) for line in raw_text.splitlines() if normalize_value(line)]
    if isinstance(raw_text, (list, tuple)):
        return [normalize_value(line) for line in raw_text if normalize_value(line)]
    return []


def _matches(pattern, value):
    return bool(pattern.search(normalize_value(value) or ""))


def is_valid_mrp(value):
    value = normalize_value(value)
    return bool(value and MRP_PATTERN.fullmatch(value) and re.search(r"\d", value))


def is_valid_quantity(value):
    return bool(QUANTITY_PATTERN.fullmatch(normalize_value(value) or ""))


def is_valid_batch_number(value):
    value = normalize_value(value)
    return bool(value and BATCH_PATTERN.fullmatch(value) and value.lower() not in NUTRITION_LABELS)


def is_valid_date(value):
    return bool(DATE_PATTERN.fullmatch(normalize_value(value) or ""))


def is_valid_phone(value):
    return bool(value and PHONE_PATTERN.search(str(value)))


def is_valid_email(value):
    return bool(value and EMAIL_PATTERN.search(str(value)))


def is_valid_website(value):
    return bool(value and WEBSITE_PATTERN.search(str(value)))


def is_valid_fssai(value):
    return bool(value and FSSAI_PATTERN.search(str(value)))


def is_valid_epr_number(value):
    return bool(value and EPR_PATTERN.search(str(value)))


def find_label(line):
    for field, pattern in FIELD_LABELS.items():
        match = pattern.match(line)
        if match:
            return field, normalize_value(match.group(1))
    return None, None


def parse_labeled_fields(raw_text):
    lines = normalize_lines(raw_text)
    parsed = {field: None for field in FIELD_LABELS}
    label_indexes = []
    for index, line in enumerate(lines):
        field, inline_value = find_label(line)
        if field:
            label_indexes.append((index, field, inline_value))
            if inline_value:
                parsed[field] = inline_value
    return parsed, lines, label_indexes
