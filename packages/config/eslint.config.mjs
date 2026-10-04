import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/coverage/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/.e2e/**",
      "**/dist/**",
      "**/.vinext/**",
      "**/.next/**",
      "**/worker-configuration.d.ts",
      "**/next-env.d.ts",
    ],
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        URL: "readonly",
        AbortSignal: "readonly",
        AbortController: "readonly",
        fetch: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
