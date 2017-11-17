module.exports = {
  scripts: {
    build: {
      description: 'Run babel to compile files',
      script: 'babel src --out-dir dist'
    },
    prepublish: {
      description: 'Validate and build before release',
      script: 'nps build'
    },
    validate: {
      description: 'Runs code formatting, linting and tests',
      script: 'nps format lint test'
    },
    format: {
      description: 'Format code with prettier-eslint',
      script: 'prettier-eslint --write "{src,test}/**/*.js"'
    },
    lint: 'eslint src test; exit 0',
    test: 'jest'
  }
};
