/**
 * e-PARAKH
 * Net Quantity Validator
 */

const QUANTITY_PATTERN =
    /^\s*(\d+(?:\.\d+)?)\s*(mg|g|kg|ml|l|mL|L)\s*$/i;

function clean(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim().replace(/\s+/g, " ");
}

function validateQuantity(declarations = {}) {
    const violations = [];
    const quantity = clean(declarations.net_quantity);

    if (!quantity) {
        violations.push({
            rule_id: "LM-QTY-001",
            field: "net_quantity",
            title: "Net Quantity Missing",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message: "Net quantity was not detected on the package.",
            value: null,
        });

        return {
            compliant: false,
            net_quantity: null,
            violations,
        };
    }

    if (!QUANTITY_PATTERN.test(quantity)) {
        violations.push({
            rule_id: "LM-QTY-002",
            field: "net_quantity",
            title: "Invalid Net Quantity Format",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message:
                "Net quantity was detected but its value or unit appears invalid.",
            value: quantity,
        });
    }

    return {
        compliant: violations.length === 0,
        net_quantity: quantity,
        violations,
    };
}

module.exports = {
    validateQuantity,
};