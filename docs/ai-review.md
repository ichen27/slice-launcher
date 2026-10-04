# Advisory AI review

GPT is the primary reviewer; Jev is an optional experiment, disabled by default. Neither changes the required `validate` gate, approves a PR, merges, deploys, or edits code. AI review can miss bugs. No paid provider call was made during implementation; project credentials and live model quality remain unverified.

## Trust boundary

`ai-review.yml` runs on `pull_request_target` against **main only**, or by explicit dispatch from main. Every checkout uses the exact protected PR base SHA (the protected workflow SHA for manual dispatch). No PR checkout, package install, import, build, test, shell command, cache, dependency hook, or contributor artifact runs in any review job. Node builtins read GitHub API data. Fixed full-SHA Actions are the only external executable dependencies.

The provider job has read-only GitHub permissions and the `ai-review` environment. It reads public contributor source as untrusted data, including fork source, while running protected review code. Ordinary contributor CI jobs receive no provider credentials. Model keys exist only in the inference step. The separate publisher has PR comment permission, no provider environment or keys, and revalidates findings against source fetched independently. The model has no tools. Provider endpoints are fixed HTTPS URLs with redirects rejected; source cannot select an endpoint.

The small report artifact contains validated findings and accounting metadata, not raw provider responses, provider errors, credentials, or full context. It is retained for three days. The publisher limits artifact size, validates the complete envelope, verifies expected base/head, fetches source again before publishing findings, escapes Markdown/HTML and mentions, and updates one bot-owned marker comment. It never interprets artifact values as commands or a PR number.

New commits replace the summary with pending status and make earlier findings stale. Final publication rechecks the head and base. Every comment explicitly applies only to its recorded SHA, so a push racing the final API write is visibly outside scope. Concurrency cancels superseded work. Missing artifacts, unavailable providers, refusals, malformed output, and incomplete review have distinct visible states; none becomes “no findings.”

## Review scope and bounded cost

Input includes exact base/head commits, changed full source on both sides, complete changed patches, trusted project standards, PR description, head/merge-commit check statuses, and surrounding textual files from touched apps and shared packages. Tooling changes also include tooling context. Check statuses are point-in-time metadata; a pending check is not a pass. Check names and PR text remain untrusted. Use manual dispatch after deterministic checks finish when a later snapshot is useful.

The branch must contain its current base. Changed-file enumeration must agree with GitHub's PR count. Truncated trees/patches, unsupported binary or rename changes, sensitive paths, missing source, or exceeded bounds produce incomplete review without a provider call. The broad surrounding-file scope is deterministic; it is not a guarantee that every runtime dependency was captured. GPT must report incomplete if necessary cross-file evidence is absent.

Hard bounds in trusted code:

| Bound                        | Limit                                                 |
| ---------------------------- | ----------------------------------------------------- |
| Changed files / source blobs | 40 / 80                                               |
| Full serialized context      | 180,000 UTF-8 bytes                                   |
| Provider calls               | At most one GPT and one Jev; zero retries             |
| Timeout                      | 90 seconds per provider                               |
| GPT output                   | 4,096 tokens, including reasoning                     |
| Provider response body       | 80,000 bytes                                          |
| Jev request                  | 26,000 UTF-8 bytes; otherwise Jev alone is incomplete |
| GitHub requests              | 220, each with a 15-second timeout and bounded body   |
| Per-review reserved cost     | At most $1; configurable downward                     |
| Findings / public comment    | 8 / 18,000 bytes                                      |

The preflight reserves both calls before spending, using UTF-8 byte count as a conservative token upper bound, framing/schema reserves, configured input rates, and the full GPT output allowance. The rates must match current provider billing. Network failures can still incur provider charges; missing usage is **unknown** (`estimatedUsd: null`), not free. Job timeouts and provider project spending limits provide additional limits. Frequent PR events/reruns multiply spend, so set provider-level monthly limits. No per-run cap substitutes for a monthly project limit.

Verified official documentation on 2026-10-04:

- [OpenAI GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4): default pinned `gpt-5.4-2026-03-05`; $2.50/M input and $15/M output under the standard context tier used here. Strict Responses structured output; `store: false`.
- [TypeSafe API](https://docs.typesafe.ai/api): `POST https://api.typesafe.ai/v1/systemone`; fixed `state` and typed `questions`. Two Noul questions ask about sensitive boundaries and test priorities.
- [TypeSafe models](https://docs.typesafe.ai/models): default pinned `jev-1.13.0`; $0.042/M input, output free; 32k tokens for state plus longest question and 64k aggregate.

Example assumption: 20,000 GPT input tokens and 2,000 output tokens cost about **$0.08**; 10,000 Jev input tokens add **$0.00042**. This is an estimate, not measured usage. OpenAI API billing is separate from ChatGPT/Codex subscriptions. Account access/credits must be checked in the provider projects. No Cloudflare AI Gateway or Workers AI integration is assumed or required.

Jev receives changed patches, never credentials. Its output must be exactly the two typed numeric answers. GPT independently receives all original source/context and may also receive those optional answers. Jev failure cannot suppress GPT, discard source, or skip security review. Unknown models require explicit current pricing configuration.

## Activation and bootstrap

1. Merge only after the user approves the completed PR. Because review code is taken from protected base, this first PR cannot exercise its new privileged workflow from contributor code. Its mocks and unprivileged checks exercise the implementation. After merge, dispatch a representative PR from main and verify the actual comment and accounting artifact.
2. Create GitHub environment `ai-review`, restrict deployment branches to protected main, and add **project-scoped** `OPENAI_API_KEY`. Add `TYPESAFE_API_KEY` only when running the Jev experiment. Configure keys in the provider/GitHub UI; never paste them into chat or commit them.
3. Configure environment/repository variables below. Keep `AI_JEV_ENABLED` false until evaluation supports it. Set provider project spending limits.
4. Exercise same-repository and fork PRs. Verify protected code is used, comments stay tied to head SHA, failures remain advisory, and required CI still blocks independently.
5. Run and manually score the live A/B evaluation before deciding to make Jev standard.

| Variable                                                   | Default / rule                     |
| ---------------------------------------------------------- | ---------------------------------- |
| `OPENAI_REVIEW_MODEL`                                      | `gpt-5.4-2026-03-05`               |
| `TYPESAFE_REVIEW_MODEL`                                    | `jev-1.13.0`                       |
| `AI_JEV_ENABLED`                                           | Disabled unless exactly `true`     |
| `AI_MAX_USD`                                               | `1`; positive and no higher than 1 |
| `GPT_INPUT_USD_PER_MILLION` / `GPT_OUTPUT_USD_PER_MILLION` | Required for nondefault GPT model  |
| `JEV_INPUT_USD_PER_MILLION`                                | Required for nondefault Jev model  |

## Reproducible A/B evaluation

Run `node scripts/ai-review/evaluate.mjs` for a **mock integration** run. Seven deliberately constructed fixtures cover active membership, deny precedence, audit atomicity, a secret-bearing workflow, prompt injection, a clean refactor, and incomplete context. Independent expected labels live in `fixtures/expected.json`; providers receive only `fixtures/contexts.json`. Fixed mock responses are a third file. The SHA-256 of the original context is recorded for each arm.

A uses GPT alone. B uses Jev plus the same GPT prompt, original context, pinned model, output limit, timeout and per-review budget. Jev is an additional bounded cost. The runner records findings, provider usage/estimated cost, latency, and statuses. It preflights the entire run against a hard $3 reservation and allows at most ten fixtures (two arms each), with no retries. Current fixture counts are seven, yielding fourteen arm results; incomplete fixtures cause no provider calls.

A live run additionally requires `--live`, `AI_EVAL_LIVE=true`, both explicit project-scoped provider keys in the shell environment, and sufficient budget. Do not source unrelated keys. `AI_EVAL_MAX_USD` may lower the $3 total cap. Output is written to `ai-review-output/evaluation-live.json`; keep it out of Git.

Location matching produces **candidate** detected/missed/false-positive counts. It is not a semantic quality oracle. A human must read source and the independent label, confirm actual bug meaning, and fill actionability/evidence quality using the included 0–2 rubric. Unmatched findings can be legitimate additional bugs; matching the right line alone can still be wrong. Compare prompt-injection behavior, incomplete statuses, human-confirmed detections/misses/false positives, quality, actual billed usage and latency. Report unavailable/failed arms instead of interpreting them as clean reviews. Repeat live runs if judging stability.

Implementation verification: thirteen focused tests cover source and output boundaries, Jev failure fallback, unavailable credentials, budget rejection, idempotent/stale publication, refusals, accounting-error redaction, and fixture scoring. The mock CLI produced all fourteen expected arm results. These results establish integration behavior only. **There is no measured evidence yet that Jev improves quality enough to justify enabling it by default.**
