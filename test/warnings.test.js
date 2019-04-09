import { createWebpackConfig, runWebpack } from './helpers/webpack'

jest.mock('request-promise')

it('adds warning if Sentry organization slug is missing', () =>
  runWebpack(
    createWebpackConfig({ organization: null, suppressErrors: true })
  ).catch(({ warnings }) => {
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toEqual(
      'Sentry Plugin: Error: Must provide organization'
    )
  }))

it('adds warning if Sentry project name is missing', () =>
  runWebpack(
    createWebpackConfig({ project: null, suppressErrors: true })
  ).catch(({ warnings }) => {
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toEqual('Sentry Plugin: Error: Must provide project')
  }))

it('adds warning if Sentry api key is missing', () =>
  runWebpack(createWebpackConfig({ apiKey: null, suppressErrors: true })).catch(
    ({ warnings }) => {
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toEqual('Sentry Plugin: Error: Must provide api key')
    }
  ))

it('adds warning if release version is missing', () =>
  runWebpack(createWebpackConfig({ suppressErrors: true })).catch(
    ({ warnings }) => {
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toEqual(
        'Sentry Plugin: Error: Must provide release version'
      )
    }
  ))

it('adds release warning to compilation', () =>
  runWebpack(
    createWebpackConfig({ release: 'bad-release', suppressErrors: true })
  ).catch(({ warnings }) => {
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toEqual('Sentry Plugin: Error: Release request error')
  }))

it('adds upload warning to compilation', () =>
  runWebpack(
    createWebpackConfig({ release: 'bad-upload', suppressErrors: true })
  ).catch(({ warnings }) => {
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toEqual('Sentry Plugin: Error: Upload request error')
  }))
