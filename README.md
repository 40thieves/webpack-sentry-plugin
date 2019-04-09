# Sentry plugin

[![Build Status](https://travis-ci.org/40thieves/webpack-sentry-plugin.svg?branch=master)](https://travis-ci.org/40thieves/webpack-sentry-plugin)

A webpack plugin to upload source maps to [Sentry](https://sentry.io/).
The current version 2 is compatible with webpack 4 and 5 and requires at least NodeJS 6.

If you are running on webpack 1, 2 or 3, please use the dedicated version 1 of the module (latest is currently `1.16.0`), which provides the same API.

### Installation

Using npm:

```
$ npm install webpack-sentry-plugin --save-dev
```

Using yarn:

```
$ yarn add webpack-sentry-plugin --dev
```

### Usage

1. Require `webpack-sentry-plugin`:

```js
var SentryPlugin = require('webpack-sentry-plugin');
```

2. Configure webpack to output source maps. Recommended reading: [webpack docs](https://webpack.js.org/configuration/devtool/), [Sentry docs](https://docs.sentry.io/clients/javascript/sourcemaps).

3. Add to webpack config:

```js
var config = {
 plugins: [
   new SentryPlugin({
     // Sentry options are required
     organization: 'your-organization-name',
     project: 'your-project-name',
     apiKey: process.env.SENTRY_API_KEY,

     // Release version name/hash is required
     release: process.env.GIT_SHA
   })
 ]
}
```

#### Options

- `organization` (alias `organisation`): **Required**, Sentry organization in which to create releases/upload source maps. Must provide the organization short name (visit `Organization settings` and find the value in the `Short name` field; this is also the segment that appears in URLs in Sentry).

- `project`: **Required**, Sentry project(s) in which to create releases/upload source maps (Sentry allows a release to be associated with one or multiple projects). Can be a string project slug or an array of project slugs if the release should be associated with multiple projects. Must provide the project short name (visit `Project settings` and find the value in the `Short name` field; this is also the segment that appears in URLs in Sentry).

- `apiKey`: **Required**, Sentry auth token ([generate one here](https://sentry.io/api/), ensure that `project:releases` is selected under scopes). (This field also accepts a Sentry API key, but Sentry has deprecated API keys in favor of auth tokens.)

- `release`: **Required**, string or function that returns the release name. See [What is a release?](#what-is-a-release) below for details.
  - If a function is provided, it is given one argument: `hash`, the compilation hash of the webpack build. (This is useful if you want to use the webpack build hash as the Sentry release name.)

- `exclude`: RegExp to match for excluded files

```js
var config = {
  plugins: [
    new SentryPlugin({
      // Exclude uploading of html
      exclude: /\.html$/,
      ...
    })
  ]
}
```

- `include`: RegExp to match for included files

```js
var config = {
  plugins: [
    new SentryPlugin({
      // Only upload foo.js & foo.js.map
      include: /foo.js/,
      ...
    })
  ]
}
```

- `filenameTransform`: Function to transform filename before uploading to Sentry. Defaults to prefixing filename with `~/`, which is used by Sentry as a [host wildcard](https://docs.sentry.io/clients/javascript/sourcemaps/#assets-multiple-origins)

```js
var config = {
  plugins: [
    new SentryPlugin({
      filenameTransform: function(filename) {
        return 'a-filename-prefix-' + filename
      }
    })
  ]
}
```

- `releaseBody`: Object or function that returns the body that will be sent to Sentry. Defaults to sending the version and projects (which is sufficient to create a basic new release in Sentry).
  - The function is given two arguments: `version` and `projects`. `version` is the result of the `release` object (string or function output); `projects` is the `project` configuration parameter (converted to an array if a single string is provided).
  - The most common use case for overriding this field is Sentry's [release commits](https://docs.sentry.io/learn/releases/#releases-are-better-with-commits) feature. To use this, define `releaseBody` per the example below (providing the most recent commit hash through whatever means works best for your build setup). See the Sentry documentation for more details and options.

```js
var config = {
  plugins: [
    new SentryPlugin({
      releaseBody: function(version, projects) {
        return {
          version,
          projects,
          refs: [{
             repository: 'project-repo',
             commit: process.env.GIT_SHA
          }]
        }
      }
    })
  ]
}
```

- `suppressErrors`: Display warnings for any errors instead of failing webpack build

- `suppressConflictError`: Similar to `suppressErrors`, but only supresses release conflict errors - useful in case webpack compilation is done during deploy on multiple instances. (Release conflict errors are HTTP 409 errors thrown by Sentry when the same source map file is uploaded to the same release multiple times.)

- `baseSentryURL`: Fully qualified URL of Sentry instance. Defaults to `https://sentry.io/api/0` for sentry.io. If self-hosting, set this to the fully qualified domain name of your instance, e.g. `https://mysentryinstance.com/api/0`

- `deleteAfterCompile`: Boolean determining whether source maps should be deleted on the build server after the webpack compile finishes. Defaults to `false`

- `createReleaseRequestOptions`: Object of options or function returning object of options passed through to the underlying `request` call on release creating; see the [request library documentation](https://github.com/request/request#requestoptions-callback) for available options.
  - If a function is provided, it is given one argument: req, an object of options (including url, auth, and body) that the plugin is sending to the underlying request call. (This is useful if you want to configure the request dynamically based on request data such as the filename.)

- `uploadFileRequestOptions`: Object of options or function returning object of options passed through to the underlying `request` call on file uploading; see the [request library documentation](https://github.com/request/request#requestoptions-callback) for available options.
  - If a function is provided, it is given one argument: req, an object of options (including url, auth, and body) that the plugin is sending to the underlying request call. (This is useful if you want to configure the request dynamically based on request data such as the filename.)

- `uploadFilesConcurrency`: Number of maximum concurrent uploads of source files to the Sentry API. Use this when the number of source files to upload to Sentry is high and you encounter the `RequestError: Error: getaddrinfo ENOTFOUND sentry.io sentry.io:443` error.

### What is a `release`?

A [release](https://docs.sentry.io/learn/releases/) is a concept that Sentry uses to attach source maps to a known version of your code. The plugin creates one for you, but you need to provide a "name" for a particular version of your code, which is just a string. Sentry can then use the release to record that an error was found in a specific known version of your code. Releases are also used to "version" your source maps -- source maps are uploaded to a specific release, and when a raw JavaScript error is reported, the release reported with the error is used to locate and apply the correct source maps.

Passing the string to the plugin really depends on your setup. There are three main approaches:

A git commit hash is very useful for releases - it is a string that defines a particular version of your code. For example, deploying to Heroku with a git hook, you can access a `SOURCE_VERSION` environment variable that is the latest commit's hash. CircleCI provides the git hash in a `CIRCLE_SHA1` environment variable. Travis provides `TRAVIS_COMMIT`. To supply it to the plugin you can configure the `release` option to be a function that returns the hash:

```js
new SentryPlugin({
  // ...
  release: function() {
    // Note: this is just an example, it depends on your deployment pipeline
    return process.env.SOURCE_VERSION;
  }
});
```

Alternatively you can use the webpack build hash. This is generated by webpack and is based on the contents of the build - so if you change the code, the hash also changes. This also is useful for Sentry releases as it identifies a particular version of your code. The plugin provides the webpack hash to you as the first argument to the release function:

```js
new SentryPlugin({
  // ...
  release: function(hash) {
    return hash; // webpack build hash
  }
});
```

If you use the webpack build hash as your release name, you will also likely need to expose the build hash to your source code in order to configure Raven (see the [Post deployment](#post-deployment) section). The easiest way to do so is with webpack's [ExtendedAPIPlugin](https://github.com/webpack/docs/wiki/list-of-plugins#extendedapiplugin).

The final option is to manually provide a string to the `release` option:

```js
new SentryPlugin({
  // ...
  release: 'foo-release'
});
```

Keep in mind that this string will need to change when you update your code. The other options above are recommended.

#### Post deployment

After you deploy you need to tell the Sentry client (Raven) which release is the current release. There is an option called `release` that you pass when configuring it:

```js
Raven.config({
  release: 'YOUR-RELEASE-STRING-HERE'
});
```

### Thanks

- Thanks to [@MikaAK](https://github.com/MikaAK) for creating [s3-webpack-plugin](https://github.com/MikaAK/s3-plugin-webpack), which inspired much of this project
- Thanks to [@danharper](https://github.com/danharper) for creating the original build script implementation

### Contributing

Contributions are welcome 😄. To run the tests, please ensure you have the relevant environment variables set up. You can `cp .env.example .env` and fill it in with test account credentials. An API key can be created [here](https://sentry.io/api/), assuming you are signed in.

#### Commands to be aware of

*Warning* ⚠️: The test suite will create releases & upload files. They should be cleaned up afterward, but ensure that you are not overwriting something important!

- `npm start`: List available commands (in green at bottom)
- `npm test`: Runs the test suite
- `npm start lint`: Runs linting
- `npm start format`: Formats code with [prettier-eslint](https://github.com/prettier/prettier-eslint)
