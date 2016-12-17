import { createWebpackConfig, runWebpack } from './webpack-helpers'

it('adds release error to compilation', () => {
	return runWebpack(createWebpackConfig({ release: 'bad-release' }))
		.catch(({ errors }) => {
			expect(errors).toHaveLength(1)
			expect(errors[0]).toEqual(`Sentry Plugin: Error: Release request error`)
		})
})

it('adds upload error to compilation', () => {
	return runWebpack(createWebpackConfig({ release: 'bad-upload' }))
		.catch(({ errors }) => {
			expect(errors).toHaveLength(1)
			expect(errors[0]).toEqual(`Sentry Plugin: Error: Upload request error`)
		})
})