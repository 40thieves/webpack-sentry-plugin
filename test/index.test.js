import fs from 'fs'
import path from 'path'
import webpack from 'webpack'

import SentryWebpackPlugin from '../index'

import { cleanUpRelease, fetchRelease, create } from './sentry-helpers'

const OUTPUT_PATH = path.resolve(__dirname, '../.tmp')

function ensureOutputPath() {
	if (!fs.existsSync(OUTPUT_PATH)) fs.mkdirSync(OUTPUT_PATH)
}

function createWebpackConfig() {
	return {
		devtool: 'source-map',
		entry: path.resolve(__dirname, 'fixtures/index.js'),
		output: {
			path: OUTPUT_PATH,
			filename: 'sentry-test.bundle.js'
		},
		plugins: [
			new SentryWebpackPlugin()
		]
	}
}

function runWebpack(config) {
	return new Promise((resolve, reject) => {
		webpack(config, (err, stats) => {
			if (stats.toJson().errors.length)
				reject({ errors: stats.toJson().errors })
			else
				resolve({ config, stats })
		})
	})
}

function expectNoCompileError({ errors }) {
	return expect(errors).toBeUndefined();
}

afterEach(cleanUpRelease)

it('creates Sentry release', () => {
	ensureOutputPath()

	const release = 'test-release'

	return runWebpack(createWebpackConfig())
		.then(expectNoCompileError)
		.then(() => {
			return fetchRelease(release).then(({ version }) => {
				expect(version).toEqual(release)
			})
		})
})

it('uploads files to Sentry release')