const declarationRules = [
	{ field: 'manufacturer', label: 'Manufacturer/packer/importer name' },
	{ field: 'address', label: 'Manufacturer/packer/importer address' },
	{ field: 'productName', label: 'Product name' },
	{ field: 'netQuantity', label: 'Net quantity' },
	{ field: 'mrp', label: 'MRP' },
	{ field: 'packingDate', label: 'Month/year of manufacture, packing, or import' },
	{ field: 'consumerCare', label: 'Consumer care details' }
];

function hasValue(value) {
	return value !== undefined && value !== null && String(value).trim() !== '';
}

function validateProduct(productData = {}) {
	const declarationResults = declarationRules.map(({ field, label }) => {
		const extractedValue = hasValue(productData[field]) ? String(productData[field]).trim() : '';
		const detected = extractedValue !== '';
		return {
			field,
			detected,
			extractedValue,
			required: true,
			expected: label,
			valid: detected,
			status: detected ? 'PASS' : 'FAIL',
			issue: detected ? '' : `${label} is missing or empty.`
		};
	});

	if (hasValue(productData.additionalDeclarations)) {
		declarationResults.push({
			field: 'additionalDeclarations',
			detected: true,
			extractedValue: String(productData.additionalDeclarations).trim(),
			required: false,
			expected: 'Other applicable declarations',
			valid: true,
			status: 'PASS',
			issue: ''
		});
	} else {
		declarationResults.push({
			field: 'additionalDeclarations',
			detected: false,
			extractedValue: '',
			required: false,
			expected: 'Other applicable declarations',
			valid: true,
			status: 'WARNING',
			issue: 'Check whether additional declarations apply to this product.'
		});
	}

	const violations = declarationResults
		.filter((result) => result.status === 'FAIL')
		.map((result) => ({
			rule: `DECLARATION_${result.field.toUpperCase()}`,
			category: 'DECLARATION',
			field: result.field,
			severity: 'HIGH',
			message: result.issue,
			detectedValue: result.extractedValue,
			expectedValue: result.expected
		}));
	const warnings = declarationResults.filter((result) => result.status === 'WARNING').map((result) => result.issue);
	const passCount = declarationResults.filter((result) => result.status === 'PASS').length;
	const score = Math.round((passCount / declarationResults.length) * 100);
	const status = violations.length ? 'FAIL' : warnings.length ? 'WARNING' : 'PASS';
	const extractedDeclarations = declarationResults.reduce((declarations, result) => {
		declarations[result.field] = result.extractedValue;
		return declarations;
	}, {});

	return {
		status,
		score,
		declarationResults,
		extractedDeclarations,
		violations,
		warnings,
		validationResults: { status, score, checkedFields: declarationRules.map((rule) => rule.field) }
	};
}

module.exports = { validateProduct };