# Sentry plugin

[![Build Status](https://travis-ci.org/40thieves/webpack-sentry-plugin.svg?branch=master)](https://travis-ci.org/40thieves/webpack-sentry-plugin)

A webpack plugin to upload source maps to [Sentry](https://sentry.io/).

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
         organisation: 'your-organisation-name',
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

- `release`: Release name to attach source maps to. Can be string or function that returns a string. If a function is passed, it will receive the build hash as an argument

```js
var config = {
  plugins: [
    new SentryPlugin({
      release: function(hash) {
        return hash
      }
    })
  ]
}
```

- `suppressErrors`: Display warnings instead of failing webpack build - useful in case webpack compilation is done during deploy on multiple instances

- `baseSentryURL`: URL of Sentry instance. Shouldn't need to set if using sentry.io, but useful if self hosting

- `deleteAfterCompile`: Boolean determining whether source maps should be deleted after the webpack compile finishes. Defaults to `false`

- `organisation`: Sentry organisation to upload files to

- `project`: Sentry project to upload files to

- `apiKey`: Sentry api key ([Generate one here](https://sentry.io/api/))


### Thanks

- Thanks to [@MikaAK](https://github.com/MikaAK) for creating [s3-webpack-plugin](https://github.com/MikaAK/s3-plugin-webpack), which inspired much of this project
- Thanks to [@danharper](https://github.com/danharper) for creating the original build script implementation

### Contributing

Contributions are welcome 😄. To run the tests, please ensure you have the relevant environment variables set up. You can `cp .env.example .env` and fill it in with test account credentials. An API key can be created [here](https://sentry.io/api/), assuming you are signed in.

#### Commands to be aware of

*Warning* ⚠️: The test suite will create releases & upload files. They should be cleaned up afterward, but ensure that you are not overwriting something important!

- `npm test`: Runs the test suite
- `npm run build`: Compiles distribution build
