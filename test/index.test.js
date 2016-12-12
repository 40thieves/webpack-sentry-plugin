import fs from 'fs'
import path from 'path'
import webpack from 'webpack'

import SentryWebpackPlugin from '../src/index'

import {
	cleanUpRelease,
	fetchRelease,
	fetchFiles,
	SENTRY_API_KEY,
	SENTRY_ORGANISATION,
	SENTRY_PROJECT
} from './sentry-helpers'

const OUTPUT_PATH = path.resolve(__dirname, '../.tmp')

function ensureOutputPath() {
	if (!fs.existsSync(OUTPUT_PATH)) fs.mkdirSync(OUTPUT_PATH)
}

function createWebpackConfig(sentryConfig) {
	return {
		devtool: 'source-map',
		entry: path.resolve(__dirname, 'fixtures/index.js'),
		output: {
			path: OUTPUT_PATH,
			filename: 'sentry-test.bundle.js'
		},
		plugins: [
			configureSentryPlugin(sentryConfig)
		]
	}
}

function configureSentryPlugin(config) {
	const options = Object.assign({}, config, {
		organisation: SENTRY_ORGANISATION,
		project: SENTRY_PROJECT,
		apiKey: SENTRY_API_KEY
	})

	return new SentryWebpackPlugin(options)
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

/*
 * Work around Jest not having expect.fail()
 */
function expectFailure(msg) {
	return () => {
		throw new Error(msg)
	}
}

function expectReleaseContainsFile(filename) {
	return (files) => {
		expect(files.filter(({ name }) => name === filename)).toHaveLength(1)
	}
}

beforeEach(ensureOutputPath)

describe('creating Sentry release', () => {
	afterAll(cleanUpRelease('string-release'))
	afterAll(cleanUpRelease('function-release'))

	it('with string version', () => {
		const release = 'string-release'

		return runWebpack(createWebpackConfig({ release }))
			.then(expectNoCompileError)
			.then(() => {
				return fetchRelease(release)
					.then(({ version }) => {
						expect(version).toEqual(release)
					})
					.catch(expectFailure('Release not found'))
			})
	})

	it('with version from function', () => {
	  const release = 'function-release'

		return runWebpack(createWebpackConfig({
			release: () => release
		}))
		.then(expectNoCompileError)
		.then(() => {
			return fetchRelease(release)
				.then(({ version }) => {
					expect(version).toEqual(release)
				})
				.catch(expectFailure('Release not found'))
		})
	})
})

describe('uploading files to Sentry release', () => {
	afterEach(cleanUpRelease('test-release'))

	it('uploads source map', () => {
		const release = 'test-release'

		return runWebpack(createWebpackConfig({ release }))
			.then(expectNoCompileError)
			.then(() => {
				return fetchFiles(release)
					.then(expectReleaseContainsFile('sentry-test.bundle.js.map'))
			})
	})

	it('uploads source bundle', () => {
	  const release = 'test-release'

		return runWebpack(createWebpackConfig({ release }))
			.then(expectNoCompileError)
			.then(() => {
				return fetchFiles(release)
					.then(expectReleaseContainsFile('sentry-test.bundle.js'))
			})
	})

	// TODO: uploads multiple bundles
})

