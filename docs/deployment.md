# Launcher deployment

The launcher is a Cloudflare Worker built with vinext. Changes to `main` run validation. Deployment stays off until `SLICE_LAUNCHER_DEPLOY_ENABLED=true` is set as a repository variable.

## Initial setup

1. Choose the Cloudflare account and production hostname. The initial account is Ivan’s; the project can later move to Slice ownership. Confirm who may sign in before enabling access.
2. Create the `slice-launcher` Worker using the `apps/launcher/wrangler.jsonc` configuration. The generated build emits `apps/launcher/dist/server/wrangler.json`, which the `deploy` script uses.
3. Add a Cloudflare Access self-hosted application covering the **exact launcher hostname**, with an allow policy for the approved people. Add a service-auth policy for a dedicated CI service token. Confirm that an unauthenticated browser request is blocked and an allowed person can reach the launcher.
4. Create a Cloudflare API token limited to this account with **Edit Cloudflare Workers** permission. Store its value in the GitHub `production` environment secret `CLOUDFLARE_API_TOKEN`; store the account ID as `CLOUDFLARE_ACCOUNT_ID` in that environment.
5. Store the Access service token as `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` in the `production` environment. Set repository variable `SLICE_LAUNCHER_URL` to the protected HTTPS origin without a trailing slash.
6. Verify the Access policy and token by requesting `/api/health` with the `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers. The expected response is HTTP 200 with `{"status":"ok"}`.
7. Set repository variable `SLICE_LAUNCHER_DEPLOY_ENABLED=true`. A push to `main` now runs `validate-main`, then `deploy-launcher` after validation succeeds. The deploy job rebuilds, deploys, and repeats the protected health check.

Do not put credentials in Git, documentation, or build output. Limit GitHub access to the `production` environment. Keep the deploy variable off until the protected URL and four secrets are present.

## Rollback

In Cloudflare Workers, select the last known good deployment and roll back. Verify the Access policy still blocks unauthenticated access, then request `/api/health` with the service token. Record the restored deployment ID and commit in the project knowledge base.

## Ownership transition

When Slice takes ownership, grant Slice maintainers access to the repository and target Cloudflare account, move or redeploy the Worker to the approved account and hostname, recreate Access policies and narrowly scoped tokens, rotate GitHub environment secrets, update `SLICE_LAUNCHER_URL`, and verify the protected smoke check. Update the repository owner only after the Slice organization is ready to administer branch rules and secrets.
