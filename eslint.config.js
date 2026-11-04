import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.strict,
  {
    languageOptions: { globals: globals.browser },
    rules: {
      // Scrollable regions such as a chat log must be focusable (WCAG 2.1.1).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'log'] }],
    },
  },
);
