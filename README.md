# Slice Launcher

The public monorepo for Slice Consulting’s app launcher and future independently deployed apps. The launcher currently contains an empty catalog; internal data is not stored in this repository.

## Workspace

- `apps/launcher`: Next.js launcher on Cloudflare Workers using vinext.
- `packages/ui`: shared app tiles and future UI components.
- `packages/config`: shared TypeScript, ESLint, and Prettier settings.
- `docs`: contributor, data, and deployment guidance.

An app can use workspace packages and its own dependencies. Each app keeps its own deployment configuration and can release independently. Add a launcher entry when its production URL is ready.

## Local development

Use Node.js 22 or newer and pnpm 10.17.1. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by vinext. Run the full gate before opening a pull request:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm format` to apply the repository style. See [adding an app](docs/adding-an-app.md), [data boundaries](docs/data-boundary.md), and [deployment](docs/deployment.md).

## Changes

Open a pull request into `main`. The `validate` job checks formatting, lint, types, tests, and a production build. Ivan reviews contributions from others; his own pull requests need no other approval. Ivan is currently the sole maintainer with write access. Production deployment is configured separately and stays disabled until Cloudflare Access and credentials are ready.

Licensed under MIT; copyright Slice Consulting.
