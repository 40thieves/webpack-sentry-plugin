import _ from 'lodash'
import request from 'request-promise'

const BASE_SENTRY_URL = `https://sentry.io/api/0/projects`

// TODO:
// Creates Sentry release
// Uploads files to Sentry release

// Other config options?

export default class SentryPlugin {
	constructor (options) {
		this.organisationSlug = options.organisation
		this.projectSlug = options.project
		this.apiKey = options.apiKey

		this.releaseVersion = _.isFunction(options.release)
			? options.release()
			: options.release
	}

	apply (compiler) {
		compiler.plugin('after-emit', (compilation, cb) => {
			// const sourceMaps = this.getSourceMaps(compilation)

			this.createRelease()
				.then(() => cb())
				// TODO: Error handling
		})
	}

	getSourceMaps (compilation) {
		return _(compilation.assets)
			.map((asset, name) => ({ name, path: asset.existsAt }))
			.filter(({name}) => /.map$/.test(name))
			.value()
	}

	createRelease () {
		return request({
			url: this.sentryReleaseUrl(),
			method: 'POST',
			auth: {
				bearer: this.apiKey
			},
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({version: this.releaseVersion})
		})
	}

	sentryReleaseUrl () {
		return `${BASE_SENTRY_URL}/${this.organisationSlug}/${this.projectSlug}/releases/`
	}
}