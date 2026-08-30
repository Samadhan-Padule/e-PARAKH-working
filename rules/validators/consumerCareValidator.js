/**
 * e-PARAKH
 * Consumer Care Details Validator
 */

const PHONE_PATTERN = /(?:\+91[\s-]?)?[6-9]\d{9}/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const WEBSITE_PATTERN =
    /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i;

function clean(value) {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim().replace(/\s+/g, " ");
}

function validateConsumerCare(declarations = {}) {
    const violations = [];
    const value = clean(declarations.customer_care);

    if (!value) {
        violations.push({
            rule_id: "LM-CC-001",
            field: "customer_care",
            title: "Consumer Care Details Missing",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message:
                "Consumer care details were not detected on the package.",
            value: null,
        });

        return {
            compliant: false,
            customer_care: null,
            violations,
        };
    }

    const lower = value.toLowerCase();

    const phoneMatches = value.match(
        /(?:\+91[\s-]?)?[6-9]\d{9}/g
    );

    const emailMatches = value.match(
        /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
    );

    const websiteMatches = value.match(
        /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi
    );

    const hasPhone =
        Array.isArray(phoneMatches) &&
        phoneMatches.some((phone) => PHONE_PATTERN.test(phone));

    const hasEmail =
        Array.isArray(emailMatches) &&
        emailMatches.some((email) => EMAIL_PATTERN.test(email));

    const hasWebsite =
        Array.isArray(websiteMatches) &&
        websiteMatches.some((website) =>
            WEBSITE_PATTERN.test(website)
        );

    /*
     * Consumer-care contact information should provide
     * at least one usable contact channel.
     */
    if (!hasPhone && !hasEmail && !hasWebsite) {
        violations.push({
            rule_id: "LM-CC-002",
            field: "customer_care",
            title: "Invalid Consumer Care Details",
            severity: "HIGH",
            status: "NON_COMPLIANT",
            message:
                "Consumer care information was detected, but no valid phone number, email address, or website was found.",
            value,
        });
    }

    /*
     * Detect whether the OCR value actually looks like
     * a consumer-care section.
     */
    const hasConsumerCareContext =
        lower.includes("customer") ||
        lower.includes("consumer") ||
        lower.includes("care") ||
        lower.includes("complaint") ||
        lower.includes("feedback");

    if (!hasConsumerCareContext) {
        violations.push({
            rule_id: "LM-CC-003",
            field: "customer_care",
            title: "Consumer Care Context Not Clear",
            severity: "LOW",
            status: "WARNING",
            message:
                "Contact information was detected, but consumer-care context could not be clearly established.",
            value,
        });
    }

    return {
        compliant: violations.every(
            (item) => item.status !== "NON_COMPLIANT"
        ),
        customer_care: value,
        contact_channels: {
            phone: hasPhone,
            email: hasEmail,
            website: hasWebsite,
        },
        violations,
    };
}

module.exports = {
    validateConsumerCare,
};