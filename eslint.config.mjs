import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent git worktrees are checked out *inside* the repo, each carrying a
    // full copy of the tree. Linting them reported 17,643 problems against the
    // real 30 — the same double-collection trap `vitest.config.ts` documents.
    ".claude/**",
    ".work/**",
  ]),
  {
    // The catalogue's ~780 images cannot be re-uploaded and exist nowhere else,
    // so the one rule that protects them is that nothing overwrites or deletes
    // a stored object. lib/storage exposes only a write-once `put()` — but the
    // SDK's `del`, `copy`, `rename` and `put({ allowOverwrite: true })` are one
    // import away, and that bypass is invisible in review. Keep the SDK behind
    // the interface. The same protection extends to @aws-sdk/client-s3 (R2).
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    ignores: ["lib/storage/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@vercel/blob",
              message:
                "Import getStorageProvider() from @/lib/storage instead. The storage SDKs stay behind lib/storage so no code path can delete or overwrite a stored image.",
            },
            {
              name: "@aws-sdk/client-s3",
              message:
                "Import getStorageProvider() from @/lib/storage instead. The storage SDKs stay behind lib/storage so no code path can delete or overwrite a stored image.",
            },
          ],
          // Subpath entry points too: `@vercel/blob/client` is a real one.
          // `paths` matches the exact specifier only.
          patterns: [
            {
              group: ["@vercel/blob/*", "@aws-sdk/client-s3/*"],
              message:
                "Import getStorageProvider() from @/lib/storage instead. The storage SDKs stay behind lib/storage so no code path can delete or overwrite a stored image.",
            },
          ],
        },
      ],
      // `no-restricted-imports` only inspects static `import` declarations, so
      // `await import('@vercel/blob')` walked straight through it — verified by
      // probe. That is not a theoretical bypass: lib/storage/index.ts selects
      // its provider with exactly that syntax, so it is the idiomatic form in
      // this codebase and the one a future edit is most likely to reach for.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportExpression > Literal.source[value=/^(@vercel\\/blob|@aws-sdk\\/client-s3)(\\/|$)/]",
          message:
            "Import getStorageProvider() from @/lib/storage instead. The storage SDKs stay behind lib/storage so no code path can delete or overwrite a stored image.",
        },
      ],
    },
  },
  {
    rules: {
      // Convention: variables prefixed with `_` are intentionally unused
      // (e.g. destructuring to omit a property), and rest-siblings are not
      // flagged as unused.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
