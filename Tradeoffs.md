# Tradeoffs

This file is a place to document decisions made during development.

### "Dumb uploader"

This plugin is really just a "dumb" uploader that achieves much of what the [Sentry CLI](sentry-cli) does but integrates better into a "webpack workflow". It relies on the Sentry feature of automatically matching source files to source map files using the filename. I have found this to work well in most projects, although it may require tweaking with the `filenameTransform` option.

I don't really have an interest in over-complicating the plugin by adding more source map related features.

[sentry-cli]: https://github.com/getsentry/sentry-cli