"""
e-PARAKH Compliance Rule Engine

Machine-assisted compliance assessment for packaged commodities.

IMPORTANT:
This engine is an application assessment aid. It does NOT replace
verification against the applicable Legal Metrology (Packaged Commodities)
Rules, 2011, current amendments, product-specific applicability, or
human inspection.

The engine intentionally distinguishes:
    PASS
    REVIEW_REQUIRED
    POTENTIAL_NON_COMPLIANCE
    NOT_DETECTABLE
    NOT_APPLICABLE

OCR absence is NOT automatically treated as legal non-compliance.
"""

import re


# ============================================================
# RULESET METADATA
# ============================================================

RULESET_VERSION = "0.2.0"

RULESET_EFFECTIVE_DATE = "2026-08-30"

SOURCE_REFERENCE = (
    "Legal Metrology (Packaged Commodities) Rules, 2011 and applicable "
    "amendments; official verification required before regulatory action."
)


# ============================================================
# STATUS CONSTANTS
# ============================================================

PASS = "PASS"
REVIEW_REQUIRED = "REVIEW_REQUIRED"
POTENTIAL_NON_COMPLIANCE = "POTENTIAL_NON_COMPLIANCE"
NOT_DETECTABLE = "NOT_DETECTABLE"
NOT_APPLICABLE = "NOT_APPLICABLE"


# ============================================================
# RULE DEFINITIONS
# ============================================================

RULES = (

    {
        "rule_id": "PC-001",
        "rule_name": "Mandatory declaration information",
        "field": "declarations",
        "description": (
            "Checks whether structured declaration information "
            "was extracted from the package image."
        ),
        "applicability": (
            "Packaged commodities; exact applicable declarations "
            "must be confirmed for the commodity."
        ),
        "validation_type": "presence",
        "severity": "MEDIUM",
    },

    {
        "rule_id": "PC-002",
        "rule_name": "Product name / commodity identification",
        "field": "product_name",
        "description": (
            "Checks whether a product or commodity name "
            "was detected."
        ),
        "applicability": (
            "Packaged commodities; exact prescribed declaration "
            "and presentation require human verification."
        ),
        "validation_type": "presence",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-003",
        "rule_name": "Manufacturer / packer / importer information",
        "field": "manufacturer",
        "description": (
            "Checks whether manufacturer, packer, importer, "
            "or related responsible-party information was extracted."
        ),
        "applicability": (
            "Packaged commodities; responsible-party category "
            "and prescribed wording require human verification."
        ),
        "validation_type": "presence",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-004",
        "rule_name": "Manufacturer address",
        "field": "manufacturer_address",
        "description": (
            "Checks whether address information associated "
            "with the manufacturer or responsible party was detected."
        ),
        "applicability": (
            "Where applicable under the packaged commodity requirements."
        ),
        "validation_type": "presence",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-005",
        "rule_name": "Net quantity declaration",
        "field": "net_quantity",
        "description": (
            "Checks whether a recognizable numeric net quantity "
            "with a supported unit was extracted."
        ),
        "applicability": (
            "Where net quantity declaration applies."
        ),
        "validation_type": "presence_and_format",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-006",
        "rule_name": "Maximum Retail Price (MRP)",
        "field": "mrp",
        "description": (
            "Checks whether an MRP value containing a recognizable "
            "numeric amount was extracted."
        ),
        "applicability": (
            "Where MRP declaration applies."
        ),
        "validation_type": "presence_and_format",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-007",
        "rule_name": "Batch / lot identification",
        "field": "batch_number",
        "description": (
            "Checks whether batch or lot information was detected."
        ),
        "applicability": (
            "Where applicable to the commodity."
        ),
        "validation_type": "presence",
        "severity": "MEDIUM",
    },

    {
        "rule_id": "PC-008",
        "rule_name": "Date of manufacture / packing",
        "field": "date_of_manufacture",
        "description": (
            "Checks whether a recognizable manufacturing or "
            "packing date was extracted."
        ),
        "applicability": (
            "Where applicable; exact declaration format requires "
            "human verification."
        ),
        "validation_type": "presence_and_format",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-009",
        "rule_name": "Use-by / best-before declaration",
        "field": "use_by",
        "description": (
            "Checks whether a recognizable use-by, expiry, "
            "or best-before value was extracted."
        ),
        "applicability": (
            "Where applicable to the commodity."
        ),
        "validation_type": "presence_and_format",
        "severity": "HIGH",
    },

    {
        "rule_id": "PC-010",
        "rule_name": "Consumer care information",
        "field": "customer_care",
        "description": (
            "Checks whether consumer/customer care contact "
            "information was extracted."
        ),
        "applicability": (
            "Where consumer care declaration applies."
        ),
        "validation_type": "presence",
        "severity": "MEDIUM",
    },

    {
        "rule_id": "PC-011",
        "rule_name": "Country of origin",
        "field": "country_of_origin",
        "description": (
            "Checks whether country-of-origin information "
            "was detected."
        ),
        "applicability": (
            "Where applicable, including applicable imported "
            "or relevant commodities."
        ),
        "validation_type": "presence",
        "severity": "MEDIUM",
    },

    {
        "rule_id": "PC-012",
        "rule_name": "Brand owner information",
        "field": "brand_owner",
        "description": (
            "Checks whether brand-owner information "
            "was extracted."
        ),
        "applicability": (
            "Where applicable to the declaration context."
        ),
        "validation_type": "presence",
        "severity": "MEDIUM",
    },

    {
        "rule_id": "PC-013",
        "rule_name": "FSSAI license information",
        "field": "fssai_license",
        "description": (
            "Checks whether a recognizable 14-digit FSSAI "
            "license number was extracted."
        ),
        "applicability": (
            "Relevant to food products where applicable; "
            "this is not itself a Legal Metrology determination."
        ),
        "validation_type": "format",
        "severity": "MEDIUM",
    },

    {
        "rule_id": "PC-014",
        "rule_name": "EPR registration information",
        "field": "epr_registration",
        "description": (
            "Checks whether an EPR-like registration identifier "
            "was detected."
        ),
        "applicability": (
            "Where applicable under the relevant environmental "
            "regulatory framework; not itself a Legal Metrology determination."
        ),
        "validation_type": "format",
        "severity": "LOW",
    },

    {
        "rule_id": "PC-015",
        "rule_name": "Declaration readability and placement",
        "field": "placement",
        "description": (
            "Checks whether OCR detected declaration labels with "
            "available spatial evidence."
        ),
        "applicability": (
            "Declaration presentation, prominence, readability and "
            "placement require package-context verification."
        ),
        "validation_type": "evidence_review",
        "severity": "HIGH",
    },

)


# ============================================================
# ADD COMMON METADATA TO RULES
# ============================================================

for _rule in RULES:
    _rule.update({
        "status": "ACTIVE",
        "version": RULESET_VERSION,
        "effective_date": RULESET_EFFECTIVE_DATE,
        "source_reference": SOURCE_REFERENCE,
    })


# ============================================================
# NORMALIZATION HELPERS
# ============================================================

def normalize_value(value):
    """
    Return a trimmed scalar value.

    Empty strings and unsupported values become None.
    """

    if value is None:
        return None

    if isinstance(value, str):

        value = value.strip()

        return value or None

    if isinstance(value, (int, float)) and not isinstance(value, bool):

        return str(value)

    return None


def field_present(value):
    """
    Determine whether a meaningful value exists.
    """

    return normalize_value(value) is not None


# ============================================================
# BASIC FORMAT VALIDATORS
# ============================================================

def _contains_number(value):
    """
    Check whether value contains at least one digit.
    """

    normalized = normalize_value(value)

    if not normalized:
        return False

    return bool(
        re.search(r"\d", normalized)
    )


def _valid_quantity(value):
    """
    Basic machine check for net quantity.

    Examples:
        500 g
        1 kg
        250 ml
        2 L
    """

    normalized = normalize_value(value)

    if not normalized:
        return False

    return bool(
        re.search(
            r"\d+(?:[.,]\d+)?\s*"
            r"(?:mg|mcg|kg|g|ml|cl|l|ltr|litre|litres|"
            r"lb|lbs|oz)\b",
            normalized,
            re.IGNORECASE,
        )
    )


def _valid_mrp(value):
    """
    Basic machine check for MRP.

    This does NOT determine whether the declared MRP is legally
    correct, printed in the prescribed manner, or free from
    misleading presentation.
    """

    normalized = normalize_value(value)

    if not normalized:
        return False

    cleaned = re.sub(
        r"\b(?:mrp|maximum\s+retail\s+price)\b",
        "",
        normalized,
        flags=re.IGNORECASE,
    )

    return bool(
        re.search(
            r"(?:₹|rs\.?|inr)?\s*\d+(?:[,.]\d{1,2})?",
            cleaned,
            re.IGNORECASE,
        )
    )


def _valid_date(value):
    """
    Basic date recognition.

    Supports common numeric and month-name formats.
    """

    normalized = normalize_value(value)

    if not normalized:
        return False

    patterns = (

        r"\b\d{1,2}[\-/\.]\d{1,2}[\-/\.]\d{2,4}\b",

        r"\b\d{1,2}[\-/\.]\d{2,4}\b",

        r"\b\d{1,2}\s+"
        r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
        r"[a-z]*\s+\d{2,4}\b",

        r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
        r"[a-z]*\s+\d{2,4}\b",

        r"\b\d{1,2}[a-z]{3}\d{2,4}\b",
    )

    return any(
        re.search(
            pattern,
            normalized,
            re.IGNORECASE,
        )
        for pattern in patterns
    )


def _valid_fssai(value):
    """
    Basic FSSAI format check.

    FSSAI license numbers are represented here as 14 digits.
    """

    normalized = normalize_value(value)

    if not normalized:
        return False

    return bool(
        re.search(
            r"\b\d{14}\b",
            normalized,
        )
    )


def _valid_epr(value):
    """
    Basic EPR identifier check.

    This only checks whether the value has a structured
    identifier-like form.
    """

    normalized = normalize_value(value)

    if not normalized:
        return False

    return bool(
        re.search(
            r"\b[A-Z0-9]{2,}"
            r"(?:[-/][A-Z0-9]+){2,}\b",
            normalized,
            re.IGNORECASE,
        )
    )


# ============================================================
# SUSPICIOUS VALUE DETECTION
# ============================================================

def _basic_value_is_suspicious(field, value):
    """
    Detect obviously unusable values.

    These checks are deliberately conservative.
    """

    normalized = normalize_value(value)

    if normalized is None:
        return False

    if field == "mrp":
        return not _valid_mrp(normalized)

    if field == "net_quantity":
        return not _valid_quantity(normalized)

    if field in {
        "date_of_manufacture",
        "use_by",
    }:
        return not _valid_date(normalized)

    if field == "fssai_license":
        return not _valid_fssai(normalized)

    if field == "epr_registration":
        return not _valid_epr(normalized)

    return False


# ============================================================
# CHECK OBJECT
# ============================================================

def make_check(
    rule,
    value,
    status,
    message,
    confidence=None,
    evidence=None,
    requires_human_verification=True,
):
    """
    Build a standardized compliance check result.
    """

    return {
        "rule_id": rule["rule_id"],
        "rule_name": rule["rule_name"],
        "field": rule["field"],
        "status": status,
        "severity": rule["severity"],
        "message": message,
        "value": normalize_value(value),
        "confidence": confidence,
        "evidence": evidence or [],
        "applicability": rule["applicability"],
        "validation_type": rule["validation_type"],
        "ruleset_version": RULESET_VERSION,
        "source_reference": rule["source_reference"],
        "requires_human_verification": requires_human_verification,
    }


# ============================================================
# GENERIC FIELD RULE VALIDATION
# ============================================================

def _validate_field_rule(rule, extracted_data):
    """
    Validate a declaration field.

    Important:
    A missing OCR field results in REVIEW_REQUIRED / NOT_DETECTABLE,
    rather than automatically declaring legal non-compliance.
    """

    field = rule["field"]

    value = extracted_data.get(field)

    # --------------------------------------------------------
    # Missing value
    # --------------------------------------------------------

    if not field_present(value):

        return make_check(
            rule,
            None,
            NOT_DETECTABLE,
            (
                f"{field.replace('_', ' ').title()} was not detected "
                "by OCR. This is not by itself proof of non-compliance."
            ),
        )

    # --------------------------------------------------------
    # Suspicious value
    # --------------------------------------------------------

    if _basic_value_is_suspicious(
        field,
        value,
    ):

        return make_check(
            rule,
            value,
            POTENTIAL_NON_COMPLIANCE,
            (
                f"The extracted {field.replace('_', ' ')} "
                "does not match the expected basic format. "
                "Manual verification is required."
            ),
        )

    # --------------------------------------------------------
    # Valid basic extraction
    # --------------------------------------------------------

    return make_check(
        rule,
        value,
        PASS,
        (
            f"{field.replace('_', ' ').title()} "
            "was detected and passed the basic machine-format check. "
            "Legal applicability and prescribed presentation require "
            "human verification."
        ),
    )


# ============================================================
# DECLARATION PRESENCE RULE
# ============================================================

def _validate_declarations_rule(
    rule,
    extracted_data,
):
    """
    Determine whether useful structured declaration data exists.
    """

    declaration_fields = [
        field
        for field in extracted_data
        if field not in {
            "placement",
            "readability",
        }
    ]

    detected_fields = [
        field
        for field in declaration_fields
        if field_present(
            extracted_data.get(field)
        )
    ]

    if detected_fields:

        return make_check(
            rule,
            f"{len(detected_fields)} declaration fields detected",
            PASS,
            (
                "Structured declaration information was extracted "
                "from the package image."
            ),
            requires_human_verification=True,
        )

    return make_check(
        rule,
        None,
        NOT_DETECTABLE,
        (
            "No structured declaration information was extracted. "
            "Image and package review is required."
        ),
    )


# ============================================================
# PLACEMENT / EVIDENCE RULE
# ============================================================

def _validate_placement_rule(
    rule,
    extracted_data,
):
    """
    Evaluate placement evidence returned by placement_analyzer.py.

    This intentionally does not declare legal placement compliance.
    """

    placement = extracted_data.get("placement")

    if not isinstance(
        placement,
        dict,
    ):

        return make_check(
            rule,
            None,
            NOT_DETECTABLE,
            (
                "Placement evidence was not supplied by the "
                "vision analysis pipeline."
            ),
        )

    placements = placement.get(
        "placements",
        [],
    )

    if not placements:

        return make_check(
            rule,
            None,
            REVIEW_REQUIRED,
            (
                "No declaration placement evidence was available. "
                "Package image review is required."
            ),
        )

    detected_count = sum(
        1
        for item in placements
        if item.get("detected")
    )

    return make_check(
        rule,
        f"{detected_count} placement records",
        REVIEW_REQUIRED,
        (
            "Declaration labels and spatial evidence were detected. "
            "Readability, prominence, prescribed font size and legal "
            "placement require human verification."
        ),
        confidence=None,
        evidence=placements,
    )


# ============================================================
# RULE DISPATCHER
# ============================================================

def _validate_rule(
    rule,
    extracted_data,
):
    """
    Route each rule to the appropriate validator.
    """

    if rule["field"] == "declarations":

        return _validate_declarations_rule(
            rule,
            extracted_data,
        )

    if rule["field"] == "placement":

        return _validate_placement_rule(
            rule,
            extracted_data,
        )

    return _validate_field_rule(
        rule,
        extracted_data,
    )


# ============================================================
# SCORE CALCULATION
# ============================================================

def calculate_score(checks):
    """
    Calculate an evidence-quality score.

    This is NOT a legal compliance percentage.

    Scoring:
        PASS                    = 100
        REVIEW_REQUIRED        = 50
        NOT_DETECTABLE         = 50
        POTENTIAL_NON_COMPLIANCE = 0
        NOT_APPLICABLE         = excluded

    The score represents how much machine-verifiable evidence
    was obtained from the submitted image.
    """

    weights = {
        PASS: 100,
        REVIEW_REQUIRED: 50,
        NOT_DETECTABLE: 50,
        POTENTIAL_NON_COMPLIANCE: 0,
    }

    applicable_checks = [
        check
        for check in checks
        if check["status"] != NOT_APPLICABLE
    ]

    if not applicable_checks:
        return 0

    total = sum(
        weights.get(
            check["status"],
            0,
        )
        for check in applicable_checks
    )

    return round(
        total / len(applicable_checks)
    )


# ============================================================
# OVERALL STATUS
# ============================================================

def determine_overall_status(checks):
    """
    Determine conservative overall machine-assessment status.
    """

    statuses = {
        check["status"]
        for check in checks
    }

    if POTENTIAL_NON_COMPLIANCE in statuses:

        return POTENTIAL_NON_COMPLIANCE

    if (
        REVIEW_REQUIRED in statuses
        or NOT_DETECTABLE in statuses
    ):

        return REVIEW_REQUIRED

    if statuses and statuses.issubset({
        PASS,
        NOT_APPLICABLE,
    }):

        return PASS

    return REVIEW_REQUIRED


# ============================================================
# VIOLATION SUMMARY
# ============================================================

def build_violation_summary(checks):
    """
    Build a frontend/report-friendly summary.
    """

    potential_violations = []

    review_items = []

    passed_items = []

    not_detectable_items = []

    for check in checks:

        status = check["status"]

        item = {
            "rule_id": check["rule_id"],
            "rule_name": check["rule_name"],
            "field": check["field"],
            "severity": check["severity"],
            "message": check["message"],
            "value": check.get("value"),
        }

        if status == POTENTIAL_NON_COMPLIANCE:

            potential_violations.append(item)

        elif status == REVIEW_REQUIRED:

            review_items.append(item)

        elif status == NOT_DETECTABLE:

            not_detectable_items.append(item)

        elif status == PASS:

            passed_items.append(item)

    return {
        "potential_non_compliance_count": len(
            potential_violations
        ),

        "review_required_count": len(
            review_items
        ),

        "not_detectable_count": len(
            not_detectable_items
        ),

        "passed_count": len(
            passed_items
        ),

        "potential_non_compliance": potential_violations,

        "review_required": review_items,

        "not_detectable": not_detectable_items,

        "passed": passed_items,
    }


# ============================================================
# FIELD SUMMARY
# ============================================================

def build_field_summary(
    extracted_data,
):
    """
    Produce a simple declaration extraction summary
    for frontend/dashboard use.
    """

    fields = {}

    for field, value in extracted_data.items():

        if field in {
            "placement",
            "readability",
        }:
            continue

        fields[field] = {
            "detected": field_present(value),
            "value": normalize_value(value),
        }

    detected = sum(
        1
        for item in fields.values()
        if item["detected"]
    )

    total = len(fields)

    return {
        "total_fields": total,
        "detected_fields": detected,
        "missing_fields": total - detected,
        "fields": fields,
    }


# ============================================================
# MAIN VALIDATION FUNCTION
# ============================================================

def validate_extracted_data(
    extracted_data,
):
    """
    Main compliance validation entry point.

    Returns a complete machine-assessment object suitable for:

        - API response
        - frontend result page
        - dashboard
        - inspection repository
        - PDF report

    It deliberately avoids claiming definitive legal compliance.
    """

    safe_data = (
        extracted_data
        if isinstance(
            extracted_data,
            dict,
        )
        else {}
    )

    # --------------------------------------------------------
    # Run all rules
    # --------------------------------------------------------

    checks = [
        _validate_rule(
            rule,
            safe_data,
        )
        for rule in RULES
    ]

    # --------------------------------------------------------
    # Overall status
    # --------------------------------------------------------

    overall_status = determine_overall_status(
        checks
    )

    # --------------------------------------------------------
    # Evidence score
    # --------------------------------------------------------

    score = calculate_score(
        checks
    )

    # --------------------------------------------------------
    # Violation summary
    # --------------------------------------------------------

    violation_summary = build_violation_summary(
        checks
    )

    # --------------------------------------------------------
    # Field summary
    # --------------------------------------------------------

    field_summary = build_field_summary(
        safe_data
    )

    # --------------------------------------------------------
    # Severity counts
    # --------------------------------------------------------

    severity_counts = {
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
    }

    for check in checks:

        if check["status"] in {
            POTENTIAL_NON_COMPLIANCE,
            REVIEW_REQUIRED,
            NOT_DETECTABLE,
        }:

            severity = check.get(
                "severity",
                "MEDIUM",
            )

            if severity in severity_counts:
                severity_counts[severity] += 1

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {

        "overall_status": overall_status,

        "score": score,

        "score_type": "MACHINE_EVIDENCE_SCORE",

        "machine_assessment": (
            "This result is an automated evidence assessment "
            "based on OCR and image-derived information. "
            "It is not a final legal determination."
        ),

        "ruleset_version": RULESET_VERSION,

        "ruleset_effective_date": RULESET_EFFECTIVE_DATE,

        "source_reference": SOURCE_REFERENCE,

        "total_rules": len(RULES),

        "checks": checks,

        "violation_summary": violation_summary,

        "field_summary": field_summary,

        "severity_summary": severity_counts,

        "human_verification_required": True,

        "regulatory_action_allowed": False,

        "recommended_action": (
            "Review the package image, extracted declarations, "
            "supporting evidence and applicable rules before "
            "taking enforcement or regulatory action."
        ),
    }


# ============================================================
# OPTIONAL RULESET INFORMATION API
# ============================================================

def get_ruleset_info():
    """
    Return ruleset metadata for frontend/admin pages.
    """

    return {
        "ruleset_version": RULESET_VERSION,
        "effective_date": RULESET_EFFECTIVE_DATE,
        "source_reference": SOURCE_REFERENCE,
        "rule_count": len(RULES),
        "human_verification_required": True,
        "rules": RULES,
    }