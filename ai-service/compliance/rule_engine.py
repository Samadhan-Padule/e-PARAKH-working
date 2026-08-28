"""Machine-verifiable, legal-safe checks for extracted package declarations.

This ruleset is an application assessment aid. It does not replace verification
against the applicable Legal Metrology (Packaged Commodities) Rules, 2011 and
current amendments by a qualified human reviewer.
"""

import re


RULESET_VERSION = "0.1.0"
RULESET_EFFECTIVE_DATE = "2026-08-28"
SOURCE_REFERENCE = (
    "Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments; "
    "official verification required before deployment"
)


RULES = (
    {
        "rule_id": "PC-001",
        "rule_name": "Mandatory declaration presence",
        "field": "declarations",
        "description": "Checks whether the extracted data contains declaration information for review.",
        "applicability": "Packaged commodities; confirm applicable declarations for the product.",
        "validation_type": "presence",
        "severity": "MEDIUM",
    },
    {
        "rule_id": "PC-002",
        "rule_name": "MRP-related check",
        "field": "mrp",
        "description": "Checks whether an MRP value was extracted and is usable for review.",
        "applicability": "Where MRP declaration applies; applicability requires human verification.",
        "validation_type": "presence_and_basic_format",
        "severity": "HIGH",
    },
    {
        "rule_id": "PC-003",
        "rule_name": "Net quantity check",
        "field": "net_quantity",
        "description": "Checks whether a net quantity value was extracted.",
        "applicability": "Where net quantity declaration applies; exact prescribed form requires human verification.",
        "validation_type": "presence_and_basic_format",
        "severity": "HIGH",
    },
    {
        "rule_id": "PC-004",
        "rule_name": "Manufacturer, packer, or importer information",
        "field": "manufacturer",
        "description": "Checks whether manufacturer, packer, or importer information was extracted.",
        "applicability": "Packaged commodities; exact responsible-party category requires human verification.",
        "validation_type": "presence",
        "severity": "HIGH",
    },
    {
        "rule_id": "PC-005",
        "rule_name": "Consumer care information",
        "field": "customer_care",
        "description": "Checks whether consumer care contact information was extracted.",
        "applicability": "Where consumer care declaration applies; exact requirements require human verification.",
        "validation_type": "presence",
        "severity": "MEDIUM",
    },
)

for _rule in RULES:
    _rule.update({
        "status": "ACTIVE",
        "version": RULESET_VERSION,
        "effective_date": RULESET_EFFECTIVE_DATE,
        "source_reference": SOURCE_REFERENCE,
    })


def normalize_value(value):
    """Return a trimmed scalar value, or None for absent/non-useful values."""
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return None


def field_present(value):
    return normalize_value(value) is not None


def _basic_value_is_suspicious(field, value):
    normalized = normalize_value(value)
    if normalized is None:
        return False
    if field in {"mrp", "net_quantity"}:
        return not bool(re.search(r"\d", normalized))
    return False


def make_check(rule, value, status, message, requires_human_verification=True):
    return {
        "rule_id": rule["rule_id"],
        "rule_name": rule["rule_name"],
        "field": rule["field"],
        "status": status,
        "severity": rule["severity"],
        "message": message,
        "value": normalize_value(value),
        "confidence": None,
        "source_reference": rule["source_reference"],
        "requires_human_verification": requires_human_verification,
    }


def _validate_rule(rule, extracted_data):
    if rule["field"] == "declarations":
        has_declarations = any(field_present(value) for value in extracted_data.values())
        if has_declarations:
            return make_check(rule, "declarations detected", "PASS", "Extracted declaration data is available for review.")
        return make_check(rule, None, "NOT_DETECTABLE", "No declaration data was extracted; image and label review is required.")

    value = extracted_data.get(rule["field"])
    if not field_present(value):
        return make_check(rule, None, "REVIEW_REQUIRED", "The value was not detected; do not treat missing OCR data as proof of non-compliance.")
    if _basic_value_is_suspicious(rule["field"], value):
        return make_check(rule, value, "POTENTIAL_NON_COMPLIANCE", "Potential non-compliance detected: the extracted value has no recognizable numeric component.")
    return make_check(rule, value, "PASS", "A value was detected; prescribed content, format, and applicability require human verification.")


def calculate_score(checks):
    """Score evidence quality, not legal compliance.

    PASS=100, REVIEW_REQUIRED/NOT_DETECTABLE=50, POTENTIAL_NON_COMPLIANCE=0.
    NOT_APPLICABLE is excluded because an inapplicable rule must not lower the score.
    """
    weights = {
        "PASS": 100,
        "REVIEW_REQUIRED": 50,
        "NOT_DETECTABLE": 50,
        "POTENTIAL_NON_COMPLIANCE": 0,
    }
    applicable_checks = [check for check in checks if check["status"] != "NOT_APPLICABLE"]
    if not applicable_checks:
        return 0
    return round(sum(weights.get(check["status"], 0) for check in applicable_checks) / len(applicable_checks))


def determine_overall_status(checks):
    statuses = {check["status"] for check in checks}
    if "POTENTIAL_NON_COMPLIANCE" in statuses:
        return "POTENTIAL_NON_COMPLIANCE"
    if "REVIEW_REQUIRED" in statuses or "NOT_DETECTABLE" in statuses:
        return "REVIEW_REQUIRED"
    if statuses and statuses.issubset({"PASS", "NOT_APPLICABLE"}):
        return "PASS"
    return "REVIEW_REQUIRED"


def validate_extracted_data(extracted_data):
    """Evaluate structured OCR output without making unsupported legal claims."""
    safe_data = extracted_data if isinstance(extracted_data, dict) else {}
    checks = [_validate_rule(rule, safe_data) for rule in RULES]
    return {
        "overall_status": determine_overall_status(checks),
        "score": calculate_score(checks),
        "ruleset_version": RULESET_VERSION,
        "checks": checks,
    }
