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

function createWebpackConfig(sentryConfig, webpackConfig) {
	return Object.assign({}, {
		devtool: 'source-map',
		entry: {
			index: path.resolve(__dirname, 'fixtures/index.js')
		},
		output: {
			path: OUTPUT_PATH,
			filename: '[name].bundle.js'
		},
		plugins: [
			configureSentryPlugin(sentryConfig)
		]
	}, webpackConfig)
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
		const filenames = files.map(({ name }) => name)
		expect(filenames).toContain(filename)

		return Promise.resolve(files)
	}
}

function expectReleaseDoesNotContainFile(filename) {
	return (files) => {
		const filenames = files.map(({ name }) => name)
		expect(filenames).not.toContain(filename)

		return Promise.resolve(files)
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

	it('uploads source and matching source map', () => {
		const release = 'test-release'

		return runWebpack(createWebpackConfig({ release }))
			.then(expectNoCompileError)
			.then(() => fetchFiles(release))
			.then(expectReleaseContainsFile('index.bundle.js'))
			.then(expectReleaseContainsFile('index.bundle.js.map'))
	})

	it('filters files based on include', () => {
		const release = 'test-release'

		return runWebpack(createWebpackConfig({
			release,
			include: /foo.bundle.js/
		}, {
			entry: {
				foo: path.resolve(__dirname, 'fixtures/foo.js'),
				bar: path.resolve(__dirname, 'fixtures/bar.js')
			}
		}))
		.then(expectNoCompileError)
		.then(() => fetchFiles(release))
		.then(expectReleaseContainsFile('foo.bundle.js'))
		.then(expectReleaseContainsFile('foo.bundle.js.map'))
		.then(expectReleaseDoesNotContainFile('bar.bundle.js'))
		.then(expectReleaseDoesNotContainFile('bar.bundle.js.map'))
	})

	it('filters files based on exclude', () => {
		const release = 'test-release'

		return runWebpack(createWebpackConfig({
			release,
			exclude: /foo.bundle.js/
		}, {
			entry: {
				foo: path.resolve(__dirname, 'fixtures/foo.js'),
				bar: path.resolve(__dirname, 'fixtures/bar.js')
			}
		}))
		.then(expectNoCompileError)
		.then(() => fetchFiles(release))
		.then(expectReleaseDoesNotContainFile('foo.bundle.js'))
		.then(expectReleaseDoesNotContainFile('foo.bundle.js.map'))
	})
})

