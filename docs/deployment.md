# Launcher deployment

The launcher is a Cloudflare Worker built with vinext and deployed with the project’s pinned Wrangler CLI. The initial production URL is `https://slice-launcher.ivan27chen.workers.dev` in Ivan’s Cloudflare account. The public shell contains no member records. Membership APIs require a verified Cloudflare Access JWT and current in-app authorization. See [membership administration and activation](membership.md) before enabling sign-in or changing the Access scope. Blank Access configuration fails closed.

## Manual deployment

From the repository root on the Mac mini, run `pnpm --filter @slice/launcher build`, then `pnpm --filter @slice/launcher run deploy`. The build emits `apps/launcher/dist/server/wrangler.json`, which the deploy script passes to Wrangler. `apps/launcher/wrangler.jsonc` enables the production `workers.dev` route and disables preview URLs. Check that `/` serves the launcher and `/api/health` returns HTTP 200 with `{"status":"ok"}`.

## Automatic deployment

A push to `main` runs `validate-main`. The `deploy-launcher` job depends on it and only runs when repository variable `SLICE_LAUNCHER_DEPLOY_ENABLED=true`. Keep that variable `false` until the following are configured:

1. Create an account-owned Cloudflare API token with **Editor** permission scoped to the existing `slice-launcher` Worker in Ivan’s account, following [Cloudflare’s permission guide](https://developers.cloudflare.com/workers/authorization/workers/). Store it as the GitHub `production` environment secret `CLOUDFLARE_API_TOKEN`, and store the account ID as `CLOUDFLARE_ACCOUNT_ID`.
2. Set repository variable `SLICE_LAUNCHER_URL` to `https://slice-launcher.ivan27chen.workers.dev` without a trailing slash.
3. Confirm the GitHub `production` environment permits only protected branches. Set `SLICE_LAUNCHER_DEPLOY_ENABLED=true` and merge a passing pull request, or manually run **Deploy launcher** on `main`.
4. Verify that `validate-main` and `deploy-launcher` pass, and that the smoke check validates the public page, health JSON, and referenced CSS/JavaScript assets.

Do not put credentials in Git, documentation, or build output. In-app authentication and authorization must protect every private page, API route, and data query before the launcher or a linked app exposes confidential content.

Deployment jobs share one production concurrency group with up to 100 pending jobs and finish without being cancelled by a newer run. Pending jobs are preserved so slower validation from an older commit cannot cancel the newest queued release; see [GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency). Before uploading, the job checks that its commit is still the current `main` commit; superseded runs skip upload. Validation also starts the built Worker locally with remote bindings disabled and probes its page, health endpoint, and assets. To run this check locally, build first and run `pnpm smoke:launcher`. To probe the deployed site, run `node scripts/check-launcher.mjs https://slice-launcher.ivan27chen.workers.dev`.

## Rollback

In Cloudflare Workers, select the last known good deployment and roll back. Request `/` and `/api/health` after rollback, then record the restored deployment ID and commit in the project knowledge base. Worker code rollback does not roll back connected data stores.

## Ownership transition

When Slice takes ownership, grant Slice maintainers access to the repository and target Cloudflare account, move or redeploy the Worker to the approved account and hostname, rotate the GitHub deployment token, update `SLICE_LAUNCHER_URL`, and verify the public health check and in-app authorization. Update the repository owner only after the Slice organization is ready to administer branch rules and secrets.
