/**
 * e-PARAKH
 * Declaration Formatting Validator
 *
 * Performs OCR-level formatting/readability checks.
 * Exact font-size and physical placement checks require
 * image geometry / vision-analysis data and are therefore
 * handled separately.
 */

function clean(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim().replace(/\s+/g, " ");
}

function addViolation(violations, rule) {
    violations.push(rule);
}

function validateFormatting(declarations = {}, options = {}) {
    const violations = [];
    const warnings = [];

    const minReadableLength =
        Number.isFinite(options.minReadableLength)
            ? options.minReadableLength
            : 2;

    for (const [field, rawValue] of Object.entries(declarations)) {
        const value = clean(rawValue);

        if (!value) {
            continue;
        }

        /*
         * OCR text containing excessive control/symbol characters
         * can indicate poor readability or OCR corruption.
         */
        const alphanumericCount = (
            value.match(/[A-Za-z0-9\u0900-\u097F]/g) || []
        ).length;

        const symbolCount = (
            value.match(/[^A-Za-z0-9\u0900-\u097F\s.,:;()/%₹&'"+\-]/g) || []
        ).length;

        if (value.length >= minReadableLength && alphanumericCount === 0) {
            addViolation(violations, {
                rule_id: "LM-FMT-001",
                field,
                title: "Unreadable Declaration",
                severity: "MEDIUM",
                status: "NON_COMPLIANT",
                message:
                    "The declaration contains no recognizable alphanumeric content.",
                value,
            });

            continue;
        }

        /*
         * Excessive unusual symbols are treated as an OCR/readability
         * warning rather than automatically declaring the package
         * legally non-compliant.
         */
        if (
            value.length >= 8 &&
            symbolCount > 0 &&
            symbolCount / value.length > 0.30
        ) {
            warnings.push({
                rule_id: "LM-FMT-002",
                field,
                title: "Possible Readability / OCR Issue",
                severity: "LOW",
                status: "WARNING",
                message:
                    "The extracted declaration contains an unusually high proportion of symbols and should be visually verified.",
                value,
            });
        }
    }

    /*
     * Formatting checks based only on OCR cannot reliably determine
     * actual printed font size, character height, declaration position,
     * contrast, or physical prominence.
     */
    if (options.vision_analysis) {
        const vision = options.vision_analysis;

        if (vision.font_size_compliant === false) {
            addViolation(violations, {
                rule_id: "LM-FMT-003",
                field: "formatting",
                title: "Font Size Requirement Not Met",
                severity: "HIGH",
                status: "NON_COMPLIANT",
                message:
                    "Vision analysis indicates that one or more declarations may not satisfy the required minimum font size.",
                value: vision.font_size_details || null,
            });
        }

        if (vision.placement_compliant === false) {
            addViolation(violations, {
                rule_id: "LM-FMT-004",
                field: "formatting",
                title: "Declaration Placement Issue",
                severity: "HIGH",
                status: "NON_COMPLIANT",
                message:
                    "Vision analysis indicates that one or more declarations may not be appropriately placed or prominent.",
                value: vision.placement_details || null,
            });
        }

        if (vision.contrast_compliant === false) {
            addViolation(violations, {
                rule_id: "LM-FMT-005",
                field: "formatting",
                title: "Declaration Readability / Contrast Issue",
                severity: "MEDIUM",
                status: "NON_COMPLIANT",
                message:
                    "Vision analysis indicates that declaration readability or contrast may be inadequate.",
                value: vision.contrast_details || null,
            });
        }
    }

    return {
        compliant: violations.length === 0,
        warnings,
        violations,
    };
}

module.exports = {
    validateFormatting,
};