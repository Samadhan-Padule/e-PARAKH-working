/**
 * e-PARAKH
 * Legal Metrology Declaration Validator
 *
 * Validates mandatory packaged-commodity declarations
 * extracted by the OCR/AI service.
 */

const REQUIRED_FIELDS = [
    "product_name",
    "manufacturer",
    "manufacturer_address",
    "net_quantity",
    "mrp",
    "batch_number",
    "date_of_manufacture",
    "customer_care",
];

const FIELD_LABELS = {
    product_name: "Product Name",
    manufacturer: "Manufacturer / Packer",
    manufacturer_address: "Manufacturer Address",
    net_quantity: "Net Quantity",
    mrp: "MRP",
    batch_number: "Batch / Lot Number",
    date_of_manufacture: "Date of Manufacture / Packing",
    customer_care: "Consumer Care Details",
};

function isPresent(value) {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === "string") {
        return value.trim().length > 0;
    }

    return true;
}

function validateDeclarationFields(declarations = {}) {
    const violations = [];
    const presentFields = [];
    const missingFields = [];

    for (const field of REQUIRED_FIELDS) {
        const value = declarations[field];

        if (isPresent(value)) {
            presentFields.push(field);
        } else {
            missingFields.push(field);

            violations.push({
                rule_id: `LM-PC-MANDATORY-${field.toUpperCase()}`,
                field,
                title: `Missing ${FIELD_LABELS[field]}`,
                severity: "HIGH",
                status: "NON_COMPLIANT",
                message: `${FIELD_LABELS[field]} was not detected in the scanned package.`,
                value: null,
            });
        }
    }

    return {
        compliant: violations.length === 0,
        total_checked: REQUIRED_FIELDS.length,
        present_count: presentFields.length,
        missing_count: missingFields.length,
        present_fields: presentFields,
        missing_fields: missingFields,
        violations,
    };
}

function getDeclarationSummary(declarations = {}) {
    const result = validateDeclarationFields(declarations);

    return {
        status: result.compliant ? "COMPLIANT" : "NON_COMPLIANT",
        total_checked: result.total_checked,
        present: result.present_count,
        missing: result.missing_count,
        violations: result.violations.length,
    };
}

module.exports = {
    REQUIRED_FIELDS,
    FIELD_LABELS,
    validateDeclarationFields,
    getDeclarationSummary,
};