import _ from 'lodash';
import request from 'request-promise';
import fs from 'fs';

const BASE_SENTRY_URL = 'https://sentry.io/api/0/projects';

const DEFAULT_TRANSFORM = filename => `~/${filename}`;

module.exports = class SentryPlugin {
  constructor(options) {
    this.baseSentryURL = options.baseSentryURL || BASE_SENTRY_URL;
    this.organisationSlug = options.organisation;
    this.projectSlug = options.project;
    this.apiKey = options.apiKey;

    this.releaseVersion = options.release;

    this.include = options.include || /\.js$|\.map$/;
    this.exclude = options.exclude;

    this.filenameTransform = options.filenameTransform || DEFAULT_TRANSFORM;
    this.suppressErrors = options.suppressErrors;
  }

  apply(compiler) {
    compiler.plugin('after-emit', (compilation, cb) => {
      const errors = this.ensureRequiredOptions();

      if (errors) {
        return this.handleErrors(errors, compilation, cb);
      }

      const files = this.getFiles(compilation);

      if (_.isFunction(this.releaseVersion)) {
        this.releaseVersion = this.releaseVersion(compilation.hash);
      }

      return this.createRelease()
        .then(() => this.uploadFiles(files))
        .then(() => cb())
        .catch(err => this.handleErrors(err, compilation, cb));
    });
  }

  handleErrors(err, compilation, cb) {
    const errorMsg = `Sentry Plugin: ${err}`;
    if (this.suppressErrors) {
      compilation.warnings.push(errorMsg);
    } else {
      compilation.errors.push(errorMsg);
    }

    cb();
  }

  ensureRequiredOptions() {
    if (!this.organisationSlug) {
      return new Error('Must provide organisation');
    } else if (!this.projectSlug) {
      return new Error('Must provide project');
    } else if (!this.apiKey) {
      return new Error('Must provide api key');
    } else if (!this.releaseVersion) {
      return new Error('Must provide release version');
    } else {
      return null;
    }
  }

  getFiles(compilation) {
    return _.reduce(
      compilation.assets,
      (acc, asset, name) => {
        return this.isIncludeOrExclude(name) ? acc.concat({ name, path: asset.existsAt }) : acc;
      },
      [],
    );
  }

  isIncludeOrExclude(filename) {
    const isIncluded = this.include ? this.include.test(filename) : true;
    const isExcluded = this.exclude ? this.exclude.test(filename) : false;

    return isIncluded && !isExcluded;
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
    });
  }

  uploadFiles(files) {
    return Promise.all(files.map(this.uploadFile.bind(this)));
  }

  uploadFile({ path, name }) {
    return request({
      url: `${this.sentryReleaseUrl()}/${this.releaseVersion}/files/`,
      method: 'POST',
      auth: {
        bearer: this.apiKey,
      },
      formData: {
        file: fs.createReadStream(path),
        name: this.filenameTransform(name),
      },
    });
  }

  sentryReleaseUrl() {
    return `${this.baseSentryURL}/${this.organisationSlug}/${this.projectSlug}/releases`;
  }
};
