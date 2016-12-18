import _ from 'lodash'
import request from 'request-promise'
import fs from 'fs'

const BASE_SENTRY_URL = 'https://sentry.io/api/0/projects'

function handleErrors(err, compilation, cb) {
	compilation.errors.push(`Sentry Plugin: ${err}`)
	cb()
}

module.exports = class SentryPlugin {
	constructor(options) {
		this.organisationSlug = options.organisation
		this.projectSlug = options.project
		this.apiKey = options.apiKey

		this.releaseVersion = _.isFunction(options.release)
			? options.release()
			: options.release

		this.include = options.include
		this.exclude = options.exclude
	}

	apply(compiler) {
		compiler.plugin('after-emit', (compilation, cb) => {
			const errors = this.ensureRequiredOptions()

			if (errors) {
				return handleErrors(errors, compilation, cb)
			}

			const files = this.getFiles(compilation)

			return this.createRelease()
				.then(() => this.uploadFiles(files))
				.then(() => cb())
				.catch((err) => handleErrors(err, compilation, cb))
		})
	}

	ensureRequiredOptions() {
		if (!this.organisationSlug) {
			return new Error('Must provide organisation')
		}
		else if (!this.projectSlug) {
			return new Error(('Must provide project'))
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

	getFiles(compilation) {
		return _.reduce(compilation.assets, (acc, asset, name) => {
			return this.isIncludeOrExclude(name)
				? acc.concat({ name, path: asset.existsAt })
				: acc
		}, [])
	}

	isIncludeOrExclude(filename) {
		const isIncluded = this.include ? this.include.test(filename) : true
		const isExcluded = this.exclude ? this.exclude.test(filename) : false

		return isIncluded && !isExcluded
	}

	createRelease() {
		return request({
			url: `${this.sentryReleaseUrl()}/`,
			method: 'POST',
			auth: {
				bearer: this.apiKey
			},
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ version: this.releaseVersion })
		})
	}

	uploadFiles(files) {
		return Promise.all(files.map(this.uploadFile.bind(this)))
	}

	uploadFile({ path, name }) {
		return request({
			url: `${this.sentryReleaseUrl()}/${this.releaseVersion}/files/`,
			method: 'POST',
			auth: {
				bearer: this.apiKey
			},
			formData: {
				file: fs.createReadStream(path),
				name
			}
		})
	}

	sentryReleaseUrl() {
		return `${BASE_SENTRY_URL}/${this.organisationSlug}/${this.projectSlug}/releases`
	}
}
