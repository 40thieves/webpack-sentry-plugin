import { createWebpackConfig, runWebpack } from './helpers/webpack'

it('adds warning if Sentry organisation slug is missing', () => {
	return runWebpack(createWebpackConfig({ organisation: null, suppressErrors: true }))
		.catch(({ warnings }) => {
			expect(warnings).toHaveLength(1)
			expect(warnings[0]).toEqual(
				'Sentry Plugin: Error: Must provide organisation'
			)
		})
})

it('adds warning if Sentry project name is missing', () => {
	return runWebpack(createWebpackConfig({ project: null, suppressErrors: true }))
		.catch(({ warnings }) => {
			expect(warnings).toHaveLength(1)
			expect(warnings[0]).toEqual('Sentry Plugin: Error: Must provide project')
		})
})

it('adds warning if Sentry api key is missing', () => {
	return runWebpack(createWebpackConfig({ apiKey: null, suppressErrors: true }))
		.catch(({ warnings }) => {
			expect(warnings).toHaveLength(1)
			expect(warnings[0]).toEqual('Sentry Plugin: Error: Must provide api key')
		})
})

it('adds warning if release version is missing', () => {
	return runWebpack(createWebpackConfig({ suppressErrors: true }))
		.catch(({ warnings }) => {
			expect(warnings).toHaveLength(1)
			expect(warnings[0]).toEqual(
				'Sentry Plugin: Error: Must provide release version'
			)
		})
})

it('adds release warning to compilation', () => {
	return runWebpack(createWebpackConfig({ release: 'bad-release', suppressErrors: true }))
		.catch(({ warnings }) => {
			expect(warnings).toHaveLength(1)
			expect(warnings[0]).toEqual('Sentry Plugin: Error: Release request error')
		})
})

it('adds upload warning to compilation', () => {
	return runWebpack(createWebpackConfig({ release: 'bad-upload', suppressErrors: true }))
		.catch(({ warnings }) => {
			expect(warnings).toHaveLength(1)
			expect(warnings[0]).toEqual('Sentry Plugin: Error: Upload request error')
		})
})
