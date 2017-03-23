# Contributing

Thanks for being willing to contribute! 👍

**Are you working on your first pull request?** [This (free) video series on Egghead](egghead) is a pretty good starting place 🙂

## Project Set Up

1. Fork and clone the repo
2. `npm install`
3. Create a Sentry test account and generate an API key [here](sentry-api)
4. `cp .env.example .env` and fill in with your test account credentials
5. `npm validate` to ensure that everything is installed & setup correctly

This project uses [`nps`](https://github.com/kentcdodds/nps). Running `npm start` will list all available commands (in green at the bottom).

## Tests

Tests can be run with `nam test`. Linting can be run with `npm run lint`

⚠️ The test suite will create releases & upload files. They should be cleaned up afterward, but ensure that you are not overwriting something important! ⚠️

## Formating

Formatting is done with [prettier](prettier). Run `npm start format` to format the code.

## Opt into git hooks 

There are optional git hooks set up on this project. They're useful to make sure that your code will pass CI, but they're turned off by default (so as not to hinder new developers). You can opt into the hooks by creating an `.opt-in` file in the root and putting this inside:

```
pre-commit
pre-push
```

[egghead]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[sentry-api]: https://sentry.io/api
[prettier]: https://github.com/prettier/prettier

