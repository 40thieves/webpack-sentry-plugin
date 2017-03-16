import _ from 'lodash'
import request from 'request-promise'
import fs from 'fs'

const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')
const SourceMapDevToolPlugin = require('webpack/lib/SourceMapDevToolPlugin')

const BASE_SENTRY_URL = 'https://sentry.io/api/0/projects'

const DEFAULT_TRANSFORM = (filename) => `~/${filename}`

module.exports = class SentryPlugin {
	constructor(options) {
		this.options = options

		this.baseSentryURL = options.baseSentryURL || BASE_SENTRY_URL
		this.organisationSlug = options.organisation
		this.projectSlug = options.project
		this.apiKey = options.apiKey

		this.releaseVersion = options.release

		this.include = options.include || /\.js$|\.map$/
		this.exclude = options.exclude

		this.filenameTransform = options.filenameTransform || DEFAULT_TRANSFORM
		this.suppressErrors = options.suppressErrors
		this.sourceMapFilenameTemplate = null
	}

	apply(compiler) {
		compiler.plugin('after-emit', (compilation, cb) => {
			const errors = this.ensureRequiredOptions()
			this.sourceMapFilenameTemplate = this.getSourcemapFilename(compilation)

			if (errors) {
				return this.handleErrors(errors, compilation, cb)
			}

			const files = this.getFiles(compilation)

			if (_.isFunction(this.releaseVersion)) {
				this.releaseVersion = this.releaseVersion(compilation.hash)
			}

			return this.createRelease()
				.then(() => this.uploadFiles(files))
				.then(() => cb())
				.catch((err) => this.handleErrors(err, compilation, cb))
		})
	}

	handleErrors(err, compilation, cb) {
		const errorMsg = `Sentry Plugin: ${err}`
		if (this.suppressErrors) {
			compilation.warnings.push(errorMsg)
		}
		else {
			compilation.errors.push(errorMsg)
		}

		cb()
	}

	ensureRequiredOptions() {
		if (!this.organisationSlug) {
			return new Error('Must provide organisation')
		}
		else if (!this.projectSlug) {
			return new Error('Must provide project')
		}
		else if (!this.apiKey) {
			return new Error('Must provide api key')
		}
		else if (!this.releaseVersion) {
			return new Error('Must provide release version')
		}
		else {
			return null
		}
	}

	/**
	 * Returns filenames and source map filenames
	 * for the given chunk
	*/
	getFilesFromChunk(compilation, chunk) {
		return chunk.files
			.filter((filename) => ModuleFilenameHelpers.matchObject(this.options, filename))
			.map((filenameWithQuery) => {
				var filename = filenameWithQuery
				var query = ''
				var idx = filenameWithQuery.indexOf('?')
				if (idx >= 0) {
					query = filenameWithQuery.substr(idx)
					filename = filenameWithQuery.substr(0, idx)
				}

				var sourceMapFilename
				if (this.sourceMapFilenameTemplate) {
					sourceMapFilename = compilation.getPath(this.sourceMapFilenameTemplate, {
						chunk,
						filename,
						query,
						basename: basename(filename),
					})
				}

				return {
					filename,
					sourceMapFilename,
				}
			})
	}

	/**
	 * Returns the filename template (e.g. [file].map) for sourcemaps.
	 * If sourcemaps are disabled, it returns null;
	 * @param {*} compilation
	 */
	getSourcemapFilename(compilation) {
		/**
		 * Gets the sourcemap filename from (prio hight to low):
		 * - This plugins' options.sourceMapFilename
		 * - SourceMapDevToolPlugin if present
		 * - webpack.config.output.sourceMapFilename
		 */

		if (this.options.sourceMapFilename) {
			return this.options.sourceMapFilename
		}

		const devtoolPlugin = compilation.options.plugins.find(
			(plugin) => plugin instanceof SourceMapDevToolPlugin,
		)
		if (devtoolPlugin && devtoolPlugin.sourceMapFilename) {
			return devtoolPlugin.sourceMapFilename
		}

		return compilation.outputOptions.sourceMapFilename
	}

	// This function works in the same way that https://github.com/webpack/webpack/blob/master/lib/SourceMapDevToolPlugin.js does
	getFiles(compilation) {
		const chunks = compilation.chunks

		// Get all files in chunks and corresponding source map filenames.
		const files = chunks.reduce(
			(filesFlattened, chunk) => {
				return filesFlattened.concat(this.getFilesFromChunk(compilation, chunk))
			},
			[],
		)

		// Get asset paths
		return files.map((file) => {
			const fileAsset = compilation.assets[file.filename]
			if (!fileAsset || !fileAsset.existsAt) {
				compilation.warnings.push(`Sentry Plugin: Asset for ${file.filename} not found`)
			}

			if (file.sourceMapFilename && compilation.assets[file.sourceMapFilename]) {
				if (!compilation.assets[file.sourceMapFilename].existsAt) {
					compilation.warnings.push(`Sentry Plugin: Asset for ${file.sourceMapFilename} not found`)
				}

				return {
					name: file.filename,
					path: fileAsset.existsAt,
					sourceMapName: file.sourceMapFilename,
					sourceMapPath: compilation.assets[file.sourceMapFilename].existsAt,
				}
			}

			return {
				name: file.filename,
				path: fileAsset.existsAt,
			}
		})
	}

	createRelease() {
		return request({
			url: `${this.sentryReleaseUrl()}/`,
			method: 'POST',
			auth: {
				bearer: this.apiKey,
			},
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ version: this.releaseVersion }),
		})
	}

	uploadFile({ path, name, headers, headerStr }) {
		let requestObj = {
			url: `${this.sentryReleaseUrl()}/${this.releaseVersion}/files/`,
			method: 'POST',
			auth: {
				bearer: this.apiKey,
			},
			formData: {
				file: fs.createReadStream(path),
				name: this.filenameTransform(name),
			},
			headers,
		};

		if (headerStr) {
			requestObj.formData.headers = headerStr
		}

		return request(requestObj);
	}

	uploadFiles(files) {
		return Promise.all(files.map((file) => {
			const headers = file.sourceMapName ? {
				sourcemap: file.sourceMapName
			} : {}
			const headerStr = file.sourceMapName ? ("sourcemap:" + file.sourceMapName) : null

			return this.uploadFile(Object.assign(file, {headers, headerStr}))
		}))
	}

	sentryReleaseUrl() {
		return `${this.baseSentryURL}/${this.organisationSlug}/${this.projectSlug}/releases`
	}
}

function basename(name) {
	if (name.indexOf('/') < 0) return name
	return name.substr(name.lastIndexOf('/') + 1)
}
