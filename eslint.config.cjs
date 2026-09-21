/* eslint-disable @typescript-eslint/no-require-imports -- ESLint loads this configuration as CommonJS on Windows. */
const { defineConfig, globalIgnores } = require("eslint/config");


// Load Next's CommonJS configs directly to avoid an ESM loader stall on Windows.

const nextVitals = require("eslint-config-next/core-web-vitals");
const nextTs = require("eslint-config-next/typescript");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-auth-tests/**",
    ".next-cloud/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".sites-runtime/**",
    ".wrangler/**",
    ".vinext/**",
    ".pnpm-store/**",
    "dist/**",
    "coverage/**",
    ".firebase/**",
    "outputs/**",
  ]),
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/components/hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

module.exports = eslintConfig;
