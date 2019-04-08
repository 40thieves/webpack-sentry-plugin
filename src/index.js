import request from 'request-promise'
import path from 'path'
import fs from 'fs'
import PromisePool from 'es6-promise-pool'

const BASE_SENTRY_URL = 'https://sentry.io/api/0'

const DEFAULT_INCLUDE = /\.js$|\.map$/
const DEFAULT_TRANSFORM = filename => `~/${filename}`
const DEFAULT_DELETE_REGEX = /\.map$/
const DEFAULT_BODY_TRANSFORM = (version, projects) => ({ version, projects })
const DEFAULT_UPLOAD_FILES_CONCURRENCY = Infinity

module.exports = class SentryPlugin {
  constructor(options) {
    // The baseSentryURL option was previously documented to have
    // `/projects` on the end. We now expect the basic API endpoint
    // but remove any `/projects` suffix for backwards compatibility.
    const projectsRegex = /\/projects$/
    if (options.baseSentryURL) {
      if (projectsRegex.test(options.baseSentryURL)) {
        // eslint-disable-next-line no-console
        console.warn(
          "baseSentryURL with '/projects' suffix is deprecated; " +
            'see https://github.com/40thieves/webpack-sentry-plugin/issues/38',
        )
        this.baseSentryURL = options.baseSentryURL.replace(projectsRegex, '')
      }
      else {
        this.baseSentryURL = options.baseSentryURL
      }
    }
    else {
      this.baseSentryURL = BASE_SENTRY_URL
    }

    this.organizationSlug = options.organization || options.organisation
    this.projectSlug = options.project
    if (typeof this.projectSlug === 'string') {
      this.projectSlug = [this.projectSlug]
    }
    this.apiKey = options.apiKey

    this.releaseBody = options.releaseBody || DEFAULT_BODY_TRANSFORM
    this.releaseVersion = options.release

    this.include = options.include || DEFAULT_INCLUDE
    this.exclude = options.exclude

    this.filenameTransform = options.filenameTransform || DEFAULT_TRANSFORM
    this.suppressErrors = options.suppressErrors
    this.suppressConflictError = options.suppressConflictError
    this.createReleaseRequestOptions =
      options.createReleaseRequestOptions || options.requestOptions || {}
    if (typeof this.createReleaseRequestOptions === 'object') {
      const { createReleaseRequestOptions } = this
      this.createReleaseRequestOptions = () => createReleaseRequestOptions
    }
    this.uploadFileRequestOptions =
      options.uploadFileRequestOptions || options.requestOptions || {}
    if (typeof this.uploadFileRequestOptions === 'object') {
      const { uploadFileRequestOptions } = this
      this.uploadFileRequestOptions = () => uploadFileRequestOptions
    }
    if (options.requestOptions) {
      // eslint-disable-next-line no-console
      console.warn(
        'requestOptions is deprecated. ' +
        'use createReleaseRequestOptions and ' +
        'uploadFileRequestOptions instead; ' +
        'see https://github.com/40thieves/webpack-sentry-plugin/pull/43'
      )
    }

    this.deleteAfterCompile = options.deleteAfterCompile
    this.deleteRegex = options.deleteRegex || DEFAULT_DELETE_REGEX
    this.uploadFilesConcurrency =
      options.uploadFilesConcurrency || DEFAULT_UPLOAD_FILES_CONCURRENCY
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise(
      'SentryPlugin',
      async (compilation) => {
        const errors = this.ensureRequiredOptions()

        if (errors) {
          this.handleErrors(errors, compilation)
          return
        }

        const files = this.getFiles(compiler, compilation)

        if (typeof this.releaseVersion === 'function') {
          this.releaseVersion = this.releaseVersion(compilation.hash)
        }

        if (typeof this.releaseBody === 'function') {
          this.releaseBody = this.releaseBody(
            this.releaseVersion,
            this.projectSlug,
          )
        }

        try {
          await this.createRelease()
          await this.uploadFiles(files)
        }
        catch (error) {
          this.handleErrors(error, compilation)
        }
      }
    )

    compiler.hooks.done.tapPromise(
      'SentryPlugin',
      async (stats) => {
        if (this.deleteAfterCompile) {
          await this.deleteFiles(compiler, stats)
        }
      }
    )
  }

  handleErrors(err, compilation) {
    const errorMsg = `Sentry Plugin: ${err}`
    if (
      this.suppressErrors ||
      (this.suppressConflictError && err.statusCode === 409)
    ) {
      compilation.warnings.push(errorMsg)
    }
    else {
      compilation.errors.push(errorMsg)
    }
  }

  ensureRequiredOptions() {
    if (!this.organizationSlug) {
      return new Error('Must provide organization')
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

  getFiles(compiler, compilation) {
    return Object.keys(compilation.assets)
      .map((name) => {
        if (this.isIncludeOrExclude(name)) {
          const filePath = path.join(
            compiler.options.output.path,
            name
          )
          return { name, filePath }
        }
        return null
      })
      .filter(i => i)
  }

  isIncludeOrExclude(filename) {
    const isIncluded = this.include ? this.include.test(filename) : true
    const isExcluded = this.exclude ? this.exclude.test(filename) : false

    return isIncluded && !isExcluded
  }

  // eslint-disable-next-line class-methods-use-this
  combineRequestOptions(req, requestOptionsFunc) {
    const requestOptions = requestOptionsFunc(req)
    const combined = Object.assign({}, requestOptions, req)
    if (requestOptions.headers) {
      Object.assign(combined.headers, requestOptions.headers, req.headers)
    }
    if (requestOptions.auth) {
      Object.assign(combined.auth, requestOptions.auth, req.auth)
    }
    return combined
  }

  async createRelease() {
    await request(
      this.combineRequestOptions(
        {
          url: `${this.sentryReleaseUrl()}/`,
          method: 'POST',
          auth: {
            bearer: this.apiKey,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.releaseBody),
        },
        this.createReleaseRequestOptions,
      ),
    )
  }

  uploadFiles(files) {
    const pool = new PromisePool(() => {
      const file = files.pop()
      if (!file) {
        return null
      }

      return this.uploadFile(file)
    }, this.uploadFilesConcurrency)
    return pool.start()
  }

  async uploadFile({ filePath, name }) {
    await request(
      this.combineRequestOptions(
        {
          url: `${this.sentryReleaseUrl()}/${this.releaseVersion}/files/`,
          method: 'POST',
          auth: {
            bearer: this.apiKey,
          },
          headers: {},
          formData: {
            file: fs.createReadStream(filePath),
            name: this.filenameTransform(name),
          },
        },
        this.uploadFileRequestOptions,
      ),
    )
  }

  sentryReleaseUrl() {
    return `${this.baseSentryURL}/organizations/${this
      .organizationSlug}/releases`
  }

  async deleteFiles(compiler, stats) {
    Object.keys(stats.compilation.assets)
      .filter(name => this.deleteRegex.test(name))
      .forEach((name) => {
        const filePath = path.join(
          compiler.options.output.path,
          name
        )
        fs.unlinkSync(filePath)
      })
  }
}
