import { expectWebpackError } from './helpers/assertion'
import { createWebpackConfig, runWebpack } from './helpers/webpack'

jest.mock('request-promise')

it('adds error if Sentry organization slug is missing', () =>
  runWebpack(createWebpackConfig({ organization: null })).catch(
    ({ errors }) => {
      expect(errors).toHaveLength(1)
      expectWebpackError(
        errors[0],
        'Sentry Plugin: Error: Must provide organization'
      )
    }
  ))

it('adds error if Sentry project name is missing', () =>
  runWebpack(createWebpackConfig({ project: null })).catch(({ errors }) => {
    expect(errors).toHaveLength(1)
    expectWebpackError(errors[0], 'Sentry Plugin: Error: Must provide project')
  }))

it('adds error if Sentry api key is missing', () =>
  runWebpack(createWebpackConfig({ apiKey: null })).catch(({ errors }) => {
    expect(errors).toHaveLength(1)
    expectWebpackError(errors[0], 'Sentry Plugin: Error: Must provide api key')
  }))

it('adds error if release version is missing', () =>
  runWebpack(createWebpackConfig()).catch(({ errors }) => {
    expect(errors).toHaveLength(1)
    expectWebpackError(
      errors[0],
      'Sentry Plugin: Error: Must provide release version'
    )
  }))

it('adds release error to compilation', () =>
  runWebpack(createWebpackConfig({ release: 'bad-release' })).catch(
    ({ errors }) => {
      expect(errors).toHaveLength(1)
      expectWebpackError(
        errors[0],
        'Sentry Plugin: Error: Release request error'
      )
    }
  ))

it('adds upload error to compilation', () =>
  runWebpack(createWebpackConfig({ release: 'bad-upload' })).catch(
    ({ errors }) => {
      expect(errors).toHaveLength(1)
      expectWebpackError(
        errors[0],
        'Sentry Plugin: Error: Upload request error'
      )
    }
  ))
