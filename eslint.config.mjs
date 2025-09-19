// @ts-check

import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(["**/out", "**/dist", "**/*.d.ts"]),
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "indent": ["warn", 2],
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        { 
          selector: "enumMember", 
          format: ["PascalCase"] 
        }
      ],
      curly: "warn",
      eqeqeq: "warn",
      "max-len": ["warn", 140],
      "no-throw-literal": "warn",
      "no-trailing-spaces": "warn",
      "prefer-const": "warn",
      quotes: "off",
      semi: ["warn", "always"],
    }
  },
);
