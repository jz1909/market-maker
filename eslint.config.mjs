// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Optional: explicit ignores (can remove if you want defaults)
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // Must come last
  prettier,
]);
