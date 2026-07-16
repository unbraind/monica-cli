export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Dependabot commit bodies contain generated release and comparison URLs
    // that cannot be wrapped. Keep Conventional Commit subject validation.
    'body-max-line-length': [0, 'always'],
  },
};
