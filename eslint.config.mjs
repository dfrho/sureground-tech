import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Zod's eval probe trips the CSP in browsers; lib/zod.ts turns it off.
const zodRule = { name: "zod", message: "Import { z } from @/lib/zod instead." };

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // A05: the only allowed use is the JSON-LD helper (components/seo/JsonLd.tsx),
      // which disables this rule on one line with a reason.
      "react/no-danger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-restricted-imports": ["error", { paths: [zodRule] }],
    },
  },
  {
    // The one place allowed to import zod directly (sets jitless for the CSP).
    files: ["lib/zod.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // lib/env.ts reads secrets and must never reach client code.
    files: ["components/**", "app/**/*.client.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@/lib/env", message: "Server env is server-only. Use @/lib/env.public." },
            zodRule,
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
