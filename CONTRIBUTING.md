# Contributing

Thanks for being willing to contribute! 👍

**Are you working on your first pull request?** [This (free) video series on Egghead][egghead] is a pretty good starting place. 🙂

## Project Set Up

1. Fork and clone the repo
2. Install [yarn](https://yarnpkg.com/lang/en/docs/install) if you don't already have it
3. `yarn install`
4. `yarn validate` to ensure that everything is installed & setup correctly

## Tests

Tests can be run with `yarn test`. Linting can be run with `yarn lint`.

The project uses [replayer][replayer]. Running `yarn test:record` will run the tests against a real Sentry instance, and cache its HTTP responses as fixtures. The default test command (`yarn test`) will run the tests against those fixtures, so you don't need to have a Sentry instance set up just to run the tests.

If you need to add new tests, you will also need to regenerate the fixtures. To do this:

1. Create a Sentry test account and generate an API key [here][sentry-api]
2. `cp .env.example .env` and fill in with your test account credentials
3. Run `yarn test:record`. ⚠️ The test suite will create releases & upload files. They should be cleaned up afterward, but ensure that you are not overwriting something important! ⚠️ Your API key and organization name are automatically filtered and will not be stored in the fixtures; however, the name of your Sentry project will be included in response fixtures, so don't name it anything embarrassing. 🙂

## Formating

Formatting is done with [prettier][prettier]. Run `yarn format` to format the code.

## Opt into git hooks 

There are optional git hooks set up on this project. They're useful to make sure that your code will pass CI, but they're turned off by default (so as not to hinder new developers). You can opt into the hooks by creating an `.opt-in` file in the root and putting this inside:

```
pre-commit
pre-push
```

[egghead]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[replayer]: https://github.com/aneilbaboo/replayer
[sentry-api]: https://sentry.io/api
[prettier]: https://github.com/prettier/prettier
