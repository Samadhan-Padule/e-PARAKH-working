const REQUIRED_FIELDS = [
    'productName',
    'manufacturer',
    'netQuantity',
    'mrp',
    'packingDate',
    'consumerCare',
    'address'
];

function normalizeText(value) {
    if (value === undefined || value === null) return '';
    return String(value).replace(/\s+/g, ' ').trim();
}

function findValue(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return normalizeText(match[1]);
        }
    }

    return '';
}

function extractDeclarations(rawOcrText = '') {
    const text = normalizeText(rawOcrText);

    return {
        productName: findValue(text, [
            /(?:product\s*name|product)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9\s-]{2,60})/i
        ]),

        manufacturer: findValue(text, [
            /(?:manufactured\s*by|manufacturer)\s*[:\-]?\s*([A-Za-z0-9\s.,&()-]{3,100})/i
        ]),

        netQuantity: findValue(text, [
            /(?:net\s*(?:quantity|wt|weight)|quantity)\s*[:\-]?\s*([0-9.]+\s*(?:g|kg|ml|l|mg))/i
        ]),

        mrp: findValue(text, [
            /(?:mrp|maximum\s*retail\s*price)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([0-9]+(?:\.[0-9]+)?)/i
        ]),

        packingDate: findValue(text, [
            /(?:packed|packing|pkd|mfd|manufactured)\s*(?:on|date)?\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-][0-9]{2,4})/i,
            /(?:packed|packing|pkd|mfd)\s*[:\-]?\s*([A-Za-z0-9\/.-]{3,20})/i
        ]),

        consumerCare: findValue(text, [
            /(?:consumer\s*care|customer\s*care|helpline|toll\s*free)\s*[:\-]?\s*([A-Za-z0-9\s+().:-]{5,120})/i
        ]),

        address: findValue(text, [
            /(?:address|office)\s*[:\-]?\s*([A-Za-z0-9\s,.-]{10,150})/i
        ]),

        countryOfOrigin: /product\s+of\s+(india|bharat)/i.test(text)
            ? 'India'
            : '',

        fssaiLicense: findValue(text, [
            /(?:fssai|license\s*no\.?|licence\s*no\.?)\s*[:\-]?\s*([0-9]{10,20})/i
        ])
    };
}

function validateDeclarations(declarations) {
    const declarationResults = [];
    const violations = [];
    const warnings = [];

    for (const field of REQUIRED_FIELDS) {
        const value = normalizeText(declarations[field]);
        const detected = Boolean(value);

        let status = detected ? 'PASS' : 'FAIL';

        let issue = detected
            ? ''
            : `${field} declaration was not detected from the product image.`;

        declarationResults.push({
            field,
            detected,
            extractedValue: value,
            required: true,
            expected: 'Declaration should be visible on package',
            valid: detected,
            status,
            issue,
            confidence: detected ? 0.8 : 0.2
        });

        if (!detected) {
            violations.push({
                rule: 'Mandatory declaration check',
                category: 'DECLARATION',
                field,
                severity: 'HIGH',
                message: issue,
                detectedValue: '',
                expectedValue: 'Declaration should be visible',
                evidenceReference: ''
            });
        }
    }

    if (!declarations.countryOfOrigin) {
        warnings.push('Country of origin was not detected from OCR.');
    }

    if (!declarations.fssaiLicense) {
        warnings.push('FSSAI license information was not reliably detected.');
    }

    const passed = declarationResults.filter(
        item => item.status === 'PASS'
    ).length;

    const total = declarationResults.length;

    const complianceScore = total
        ? Math.round((passed / total) * 100)
        : 0;

    let overallStatus = 'NON_COMPLIANT';

    if (complianceScore === 100) {
        overallStatus = 'COMPLIANT';
    } else if (complianceScore >= 70) {
        overallStatus = 'WARNING';
    }

    return {
        overallStatus,
        complianceScore,
        declarationResults,
        violations,
        warnings
    };
}

function analyzeCompliance(rawOcrText) {
    const extractedDeclarations =
        extractDeclarations(rawOcrText);

    const validationResults =
        validateDeclarations(extractedDeclarations);

    return {
        extractedDeclarations,
        ...validationResults
    };
}

module.exports = {
    extractDeclarations,
    validateDeclarations,
    analyzeCompliance
};