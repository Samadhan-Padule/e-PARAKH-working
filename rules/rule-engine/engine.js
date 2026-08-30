const { getApplicableRules } = require("./applicability");
const { evaluateResults } = require("./evaluator");

const declarationValidator = require("../validators/declarationValidator");
const manufacturerValidator = require("../validators/manufacturerValidator");
const quantityValidator = require("../validators/quantityValidator");
const mrpValidator = require("../validators/mrpValidator");
const consumerCareValidator = require("../validators/consumerCareValidator");
const formattingValidator = require("../validators/formattingValidator");

const validators = {
  declaration: declarationValidator.validateDeclarationFields,
  manufacturer: manufacturerValidator.validateManufacturer,
  quantity: quantityValidator.validateQuantity,
  mrp: mrpValidator.validateMRP,
  consumer_care: consumerCareValidator.validateConsumerCare,
  formatting: formattingValidator.validateFormatting
};

function runComplianceCheck(data = {}) {
  const applicability = getApplicableRules(data);

  const results = applicability.applicable_rules
    .filter(rule => typeof validators[rule] === "function")
    .map(rule => ({
      rule,
      result: validators[rule](data)
    }));

  const evaluation = evaluateResults(
    results.map(item => item.result)
  );

  return {
    compliant: evaluation.compliant,
    total_rules_checked: evaluation.total_rules_checked,
    violation_count: evaluation.violation_count,
    warning_count: evaluation.warning_count,
    applicable_rules: applicability.applicable_rules,
    violations: evaluation.violations,
    warnings: evaluation.warnings,
    results
  };
}

module.exports = {
  runComplianceCheck
};