import { test } from "node:test";
import assert from "node:assert/strict";
import { severeFindings } from "./check-sarif.mjs";
function report(severity, result = { ruleId: "test" }) {
  return {
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: { rules: [{ id: "test", properties: { "security-severity": severity } }] },
        },
        results: [result],
      },
    ],
  };
}
test("high/critical findings block even when a SARIF suppression is present", () => {
  assert.equal(severeFindings(report("7.5")).length, 1);
  assert.equal(
    severeFindings(report("9.8", { ruleId: "test", suppressions: [{ kind: "inSource" }] })).length,
    1,
  );
  assert.equal(severeFindings(report("4.5")).length, 0);
});
test("failed or missing analysis cannot look clean", () => {
  assert.throws(() => severeFindings({ version: "2.1.0", runs: [] }));
  const value = report("0");
  value.runs[0].invocations = [{ executionSuccessful: false }];
  assert.throws(() => severeFindings(value));
});
