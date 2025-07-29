module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    // Add this line to disable the line length rule
    "max-len": "off",
  },
  parserOptions: {
    ecmaVersion: 2021,
  },
};
