/**
 * e-PARAKH
 * Manufacturer / Packer Validator
 */

const MIN_NAME_LENGTH = 3;
const MIN_ADDRESS_LENGTH = 8;

function clean(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim().replace(/\s+/g, " ");
}

function validateManufacturer(declarations = {}) {
    const violations = [];

    const manufacturer = clean(declarations.manufacturer);
    const address = clean(declarations.manufacturer_address);

    if (!manufacturer) {
        violations.push({
            rule_id: "LM-MFR-001",
            field: "manufacturer",
            title: "Manufacturer / Packer Name Missing",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message: "Manufacturer or packer name was not detected.",
            value: null,
        });
    } else if (manufacturer.length < MIN_NAME_LENGTH) {
        violations.push({
            rule_id: "LM-MFR-002",
            field: "manufacturer",
            title: "Invalid Manufacturer / Packer Name",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message: "Manufacturer or packer name appears incomplete.",
            value: manufacturer,
        });
    }

    if (!address) {
        violations.push({
            rule_id: "LM-MFR-003",
            field: "manufacturer_address",
            title: "Manufacturer Address Missing",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message: "Complete manufacturer / packer address was not detected.",
            value: null,
        });
    } else if (address.length < MIN_ADDRESS_LENGTH) {
        violations.push({
            rule_id: "LM-MFR-004",
            field: "manufacturer_address",
            title: "Manufacturer Address Appears Incomplete",
            severity: "MEDIUM",
            status: "NON_COMPLIANT",
            message: "Manufacturer address appears too short to be a complete address.",
            value: address,
        });
    }

    return {
        compliant: violations.length === 0,
        manufacturer: manufacturer,
        manufacturer_address: address,
        violations,
    };
}

module.exports = {
    validateManufacturer,
};