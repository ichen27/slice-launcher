# Security checks and review

## Automated gates

Secret scanning and push protection were already enabled on inspection (2026-10-04). Dependabot alerts and security updates have now been enabled; version-update configuration is in `.github/dependabot.yml`. CodeQL advanced analysis scans JavaScript/TypeScript and Actions without building contributor code in its write-permission job. High/critical security findings (score >=7) and error-level findings fail the SARIF gate; failed/missing scanner output fails. PR dependency review rejects newly introduced high/critical vulnerabilities. Lower-severity findings remain visible for triage. All external Actions are pinned to verified upstream commit SHAs and updated by Dependabot.

The stable required `validate` check aggregates quality and security. A cancelled, failed, skipped, or missing required prerequisite is not success. GitHub-hosted runners have no dependency on the Mac mini. PR code execution jobs receive no production/model credentials. CodeQL's write token is limited to security events; it performs no install/build of contributor code. Do not execute PR code from pull_request_target or download executable PR artifacts in privileged review jobs.

## Exceptions

No exceptions are currently configured. Never globally disable scanning or lower severity thresholds to land a change. An exception requires a separate owner-reviewed PR recording the exact advisory/rule, affected dependency/version/path, reason, mitigation, owner, expiry (maximum 14 days), and removal issue. The PR must implement a matching scoped allow entry plus a date-expiry check and tests that an expired/unrelated exception still fails. Until those mechanics are reviewed and merged the gate remains blocked. Suppressions in SARIF do not bypass the severity gate. This deliberate process prevents an undocumented permanent bypass.

## Human review

Authentication changes: trace issuer/audience/signature validation, expiry, service rejection, identity linking, and failure behavior. Authorization changes: trace current membership, pending/suspended restrictions, deny overrides, delegation, last owner, direct APIs and private directory data. Schema changes: test empty and prior-state upgrades, constraints, audit atomicity, and backward compatibility. Workflow changes: inspect every trigger, checked-out ref, credential scope, cache/artifact source, shell interpolation, cancellation, and publishing permission. Review the actual diff even when automated checks pass.

Ivan is the sole maintainer. Zero required independent approvals preserves his own-PR workflow; this does not technically prevent a future write collaborator merging their own PR. Revisit permissions before adding write maintainers. No AI check can approve, merge, deploy, mutate the database, or waive deterministic checks.
