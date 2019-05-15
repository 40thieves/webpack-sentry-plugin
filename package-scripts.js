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
      script: 'nps lint test'
    },
    format: {
      description: 'Format code with prettier-eslint',
      script: 'prettier-eslint --write "{src,test}/**/*.js"'
    },
    lint: {
      description: 'Run eslint to ensure code is correctly formatted',
      script: 'eslint src test'
    },
    test: {
      description: 'Run tests, using stored fixtures for Sentry responses',
      script: 'VCR_MODE=playback jest'
    },
    'test:record': {
      description: 'Run tests + regenerate fixtures with real Sentry instance',
      script: 'rm ./test/fixtures/replayer/* && VCR_MODE=record jest'
    }
  }
}
