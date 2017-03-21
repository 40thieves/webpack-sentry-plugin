# Contributing

Thanks for being willing to contribute! 👍

**Are you working on your first pull request?** [This (free) video series on Egghead](egghead) is a pretty good starting place 🙂

## Project Set Up

1. Fork and clone the repo
2. `npm install`
3. Create a Sentry test account and generate an API key [here](sentry-api)
4. `cp .env.example .env` and fill in with your test account credentials
5. `npm test && npm run lint` to ensure that everything is installed & setup correctly

## Tests

Tests can be run with `nam test`. Linting can be run with `npm run lint`

⚠️ The test suite will create releases & upload files. They should be cleaned up afterward, but ensure that you are not overwriting something important! ⚠️

[egghead]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[sentry-api]: https://sentry.io/api/