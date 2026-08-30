function getApplicableRules(data = {}) {
  const rules = [
    "declaration",
    "manufacturer",
    "quantity",
    "mrp",
    "consumer_care",
    "formatting"
  ];

  const applicableRules = [];

  // Basic packaged-commodity declarations
  if (data.product_name || data.raw_ocr_text || data) {
    applicableRules.push("declaration");
  }

  // Manufacturer information
  if (data.manufacturer || data.manufacturer_address) {
    applicableRules.push("manufacturer");
  }

  // Net quantity
  if (data.net_quantity) {
    applicableRules.push("quantity");
  }

  // MRP
  if (data.mrp) {
    applicableRules.push("mrp");
  }

  // Consumer care
  if (data.customer_care) {
    applicableRules.push("consumer_care");
  }

  // Formatting / visual declarations
  if (data.vision_analysis || data.product_name || data.net_quantity || data.mrp) {
    applicableRules.push("formatting");
  }

  // Ensure mandatory rules are checked even when fields are missing.
  if (!applicableRules.includes("declaration")) {
    applicableRules.push("declaration");
  }

  return {
    applicable_rules: [...new Set(applicableRules)],
    total_applicable: [...new Set(applicableRules)].length,
    all_supported_rules: rules
  };
}

module.exports = {
  getApplicableRules
};