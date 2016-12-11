// TODO:
// Class that implements apply() fn
// Find source map files
// Creates Sentry release
// Uploads files to Sentry release

// Config options?

// Create release request
// request({
// 	url: `${SENTRY_URL}/`,
// 	method: 'POST',
// 	auth: {
// 		bearer: SENTRY_API_KEY
// 	},
// 	headers: {
// 		'Content-Type': 'application/json'
// 	},
// 	body: JSON.stringify({ version: 'test-release' }),
// 	resolveWithFullResponse: true
// })

export default class SentryPlugin {
	apply (compiler) {

	}
}