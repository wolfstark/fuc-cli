module.exports = {
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    require.resolve('eslint-config-airbnb-base'),
  ],
  settings: {
    'import/resolver': {
      webpack: {
        config: require.resolve('fuc-cli-service/webpack.config.js'),
      },
    },
    'import/extensions': [
      '.js',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
    ],
  },
  rules: {
    'import/extensions': ['error', 'always', {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
    // https://github.com/eslint/typescript-eslint-parser#known-issues
    'no-undef': 'off',
    'no-unused-vars': 'off',
    // https://github.com/eslint/typescript-eslint-parser/issues/445
    // 'typescript/no-unused-vars': 'error'
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
  plugins: ['typescript'],
  parserOptions: {
    parser: require.resolve('typescript-eslint-parser'),
  },
};
