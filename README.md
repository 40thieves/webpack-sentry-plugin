# Sentry plugin

[![Build Status](https://travis-ci.org/40thieves/webpack-sentry-plugin.svg?branch=master)](https://travis-ci.org/40thieves/webpack-sentry-plugin)

A webpack (v1 or 2) plugin to upload source maps to [Sentry](https://sentry.io/).

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

2. Configure webpack to output source maps. Recommended reading: [webpack docs](https://webpack.js.org/configuration/devtool/), [Sentry docs](https://docs.sentry.io/clients/javascript/sourcemaps)

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
         release: function() {
           return process.env.GIT_SHA
         }
       })
     ]
   }
   ```

#### Options

- `organization`: **Required**, Sentry organization to upload files to

- `project`: **Required**, Sentry project(s) to upload files to. Can be a string project slug or an array of project slugs if the release should be associated with multiple projects.

- `apiKey`: **Required**, Sentry api key ([Generate one here](https://sentry.io/api/), ensure that `project:write`, `project:read` and `project:releases` are selected ,under scopes)

- `release`: **Required**, string or function that returns the release name. See [What is a release?](#what-is-a-release) below for details

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
  
  - `releaseBody`: Object or function that returns the body that will be sent to Sentry. Defaults to sending the version.

  ```js
  var config = {
    plugins: [
      new SentryPlugin({
        releaseBody: function(version) {
          return { 
            version,
            refs: [
               repository: 'project-repo',
               commit: process.env.GIT_SHA
            ]
          }
        }
      })
    ]
  }
  ```

- `suppressErrors`: Display warnings instead of failing webpack build

- `suppressConflictError`: Similar to `suppressErrors`, but only supresses release conflict errors - useful in case webpack compilation is done during deploy on multiple instances

- `baseSentryURL`: URL of Sentry instance. Shouldn't need to set if using sentry.io, but useful if self hosting

- `deleteAfterCompile`: Boolean determining whether source maps should be deleted after the webpack compile finishes. Defaults to `false`

### What is a `release`?

A release is a concept that Sentry uses to attach source maps to a known version of your code. The plugin creates one for you, but you need to provide a "name" for a particular version of your code, which is just a string. Sentry can then use the release to say that a it found an error in this known version of your code. 

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
