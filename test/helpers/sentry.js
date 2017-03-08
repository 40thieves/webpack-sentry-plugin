import request from 'request-promise';
import dotenv from 'dotenv';

// Silence logs if .env file is missing (configured through environment
// variables instead)
dotenv.load({ silent: true });

export const {
  SENTRY_API_KEY,
  SENTRY_ORGANISATION,
  SENTRY_PROJECT,
} = process.env;

const SENTRY_URL = `https://sentry.io/api/0/projects/${SENTRY_ORGANISATION}/${SENTRY_PROJECT}`;

export function cleanUpRelease(releaseVersion) {
  return () => {
    return request({
      url: `${SENTRY_URL}/releases/${releaseVersion}/`,
      method: 'DELETE',
      auth: {
        bearer: SENTRY_API_KEY,
      },
    }).catch(err => {
      // eslint-disable-next-line no-console
      console.error(
        `ERROR CLEANING UP RELEASE!
Release version: ${releaseVersion}
Status: ${err.statusCode}
Error: ${err.error}`,
      );
    });
  };
}

export function fetchRelease(version) {
  return request({
    url: `${SENTRY_URL}/releases/${version}/`,
    auth: {
      bearer: SENTRY_API_KEY,
    },
    json: true,
  });
}

export function fetchFiles(version) {
  return request({
    url: `${SENTRY_URL}/releases/${version}/files/`,
    auth: {
      bearer: SENTRY_API_KEY,
    },
    json: true,
  });
}
