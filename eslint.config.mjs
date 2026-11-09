import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    },
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
