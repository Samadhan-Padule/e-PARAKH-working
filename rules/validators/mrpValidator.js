/**
 * e-PARAKH
 * Maximum Retail Price (MRP) Validator
 */

function clean(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim().replace(/\s+/g, " ");
}

function validateMRP(declarations = {}) {
    const violations = [];
    const mrp = clean(declarations.mrp);

    if (!mrp) {
        violations.push({
            rule_id: "LM-MRP-001",
            field: "mrp",
            title: "MRP Missing",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message: "Maximum Retail Price (MRP) was not detected.",
            value: null,
        });

        return {
            compliant: false,
            mrp: null,
            violations,
        };
    }

    // Accept common OCR representations:
    // ₹150
    // Rs. 150
    // Rs 150
    // INR 150
    // 150/-
    // 150
    const mrpPattern =
        /^(?:₹\s*|rs\.?\s*|inr\s*)?\d+(?:\.\d{1,2})?(?:\s*\/-)?$/i;

    if (!mrpPattern.test(mrp)) {
        violations.push({
            rule_id: "LM-MRP-002",
            field: "mrp",
            title: "Invalid MRP Format",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message: "MRP was detected but its format appears invalid.",
            value: mrp,
        });
    }

    return {
        compliant: violations.length === 0,
        mrp,
        violations,
    };
}

module.exports = {
    validateMRP,
};