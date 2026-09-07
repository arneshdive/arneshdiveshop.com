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
  ]),
  {
    // The catalogue's ~780 images cannot be re-uploaded and exist nowhere else,
    // so the one rule that protects them is that nothing overwrites or deletes
    // a stored object. lib/storage exposes only a write-once `put()` — but the
    // SDK's `del`, `copy`, `rename` and `put({ allowOverwrite: true })` are one
    // import away, and that bypass is invisible in review. Keep the SDK behind
    // the interface.
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
          ],
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
