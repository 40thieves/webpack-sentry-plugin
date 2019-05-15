import path from 'path'
import replayer from 'replayer'
import webpack from 'webpack'

import SentryWebpackPlugin from '../../src/index'

import { SENTRY_API_KEY, SENTRY_ORGANIZATION, SENTRY_PROJECT } from './sentry'

export const OUTPUT_PATH = path.resolve(__dirname, '../../.tmp')

replayer.configure({
  includeHeaderNames: false,
  includeCookieNames: false
})
replayer.filter({
  url: /(.*)/,
  bodyFilter: (body) => {
    // Form data payloads start and end with a sentinel
    // that changes on every request. Strip it off and
    // only consider the actual file body.
    if (body.startsWith('-----')) {
      const parts = body.split('\r\n')
      return parts.slice(1, parts.length - 6).join('\r\n')
    }
    const bodyProjectRegex = new RegExp(SENTRY_PROJECT)
    return body.replace(bodyProjectRegex, 'test-project')
  },
  urlFilter: (url) => {
    const orgRegex = new RegExp(`/${SENTRY_ORGANIZATION}`)
    const projectRegex = new RegExp(`/${SENTRY_PROJECT}`)
    return url
      .replace(orgRegex, '/test-organization')
      .replace(projectRegex, '/test-project')
  }
})
replayer.substitute('test-organization', () => SENTRY_ORGANIZATION)
replayer.substitute('test-project', () => SENTRY_PROJECT)
replayer.substitute('test-api-key', () => SENTRY_API_KEY)

export function createWebpackConfig(sentryConfig, webpackConfig) {
  return Object.assign(
    {},
    {
      mode: 'none',
      devtool: 'source-map',
      entry: {
        index: path.resolve(__dirname, '../fixtures/index.js')
      },
      output: {
        path: OUTPUT_PATH,
        filename: '[name].bundle.js'
      },
      plugins: [configureSentryPlugin(sentryConfig)]
    },
    webpackConfig
  )
}

function configureSentryPlugin(config) {
  const options = Object.assign(
    {},
    {
      organization: SENTRY_ORGANIZATION,
      project: SENTRY_PROJECT,
      apiKey: SENTRY_API_KEY
    },
    config
  )

  return new SentryWebpackPlugin(options)
}

export function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (stats.toJson().errors.length) {
        reject({ errors: stats.toJson().errors })
      }
      if (stats.toJson().warnings.length) {
        reject({ warnings: stats.toJson().warnings })
      }
      else {
        resolve({ config, stats })
      }
    })
  })
}
