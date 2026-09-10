#!/usr/bin/env node

import { evaluateProductionConfiguration } from "./lib/production-configuration.mjs";

const result = evaluateProductionConfiguration(process.env);
if (result.ok) {
  console.log(`PASS production configuration: ${result.checkedFields} security-critical fields checked; secret values were not printed.`);
} else {
  console.error(`BLOCKED production configuration: ${result.findings.length} finding(s); secret values were not printed.`);
  for (const item of result.findings) console.error(`- ${item.state} ${item.field}: ${item.message}`);
  process.exitCode = 1;
}
