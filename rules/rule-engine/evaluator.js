function evaluateResults(results) {
  const safeResults = Array.isArray(results) ? results : [];

  const violations = safeResults.flatMap(
    result => Array.isArray(result?.violations) ? result.violations : []
  );

  const warnings = safeResults.flatMap(
    result => Array.isArray(result?.warnings) ? result.warnings : []
  );

  return {
    compliant: violations.length === 0,
    total_rules_checked: safeResults.length,
    violation_count: violations.length,
    warning_count: warnings.length,
    violations,
    warnings
  };
}

module.exports = {
  evaluateResults
};
