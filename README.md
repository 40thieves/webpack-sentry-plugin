# Sentry plugin

A webpack plugin to upload source maps to [Sentry](https://sentry.io/).

⚠ WIP ⚠

### Installation

Coming soon!

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
- `organisation`: Sentry organisation to upload files to
- `project`: Sentry project to upload files to
- `apiKey`: Sentry api keys. See [Sentry docs](https://docs.sentry.io/clients/javascript/sourcemaps/#uploading-source-maps-to-sentry) for info on how to create one
- `release`: Release name to attach source maps to. Can be string or function

### Thanks

- Thanks to [@MikaAK](https://github.com/MikaAK) for creating [s3-webpack-plugin](https://github.com/MikaAK/s3-plugin-webpack), which inspired much of this project
- Thanks for [@danharper](https://github.com/danharper) for creating the original build script implementation
