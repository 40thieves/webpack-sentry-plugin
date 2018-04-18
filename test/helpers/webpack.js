import path from 'path'
import webpack from 'webpack'

import SentryWebpackPlugin from '../../src/index'

import { SENTRY_API_KEY, SENTRY_ORGANIZATION, SENTRY_PROJECT } from './sentry'

export const OUTPUT_PATH = path.resolve(__dirname, '../../.tmp')

export function createWebpackConfig(sentryConfig, webpackConfig) {
  return Object.assign(
    {},
    {
      mode: 'none',
      devtool: 'source-map',
      entry: {
        index: path.resolve(__dirname, '../fixtures/index.js'),
      },
      output: {
        path: OUTPUT_PATH,
        filename: '[name].bundle.js',
      },
      plugins: [configureSentryPlugin(sentryConfig)],
    },
    webpackConfig,
  )
}

function configureSentryPlugin(config) {
  const options = Object.assign(
    {},
    {
      organization: SENTRY_ORGANIZATION,
      project: SENTRY_PROJECT,
      apiKey: SENTRY_API_KEY,
    },
    config,
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
