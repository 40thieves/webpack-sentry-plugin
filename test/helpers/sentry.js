import request from 'request-promise'
import dotenv from 'dotenv'

// Silence logs if .env file is missing (configured through environment
// variables instead)
dotenv.load({ silent: true })

const recording = process.env.VCR_MODE === 'record'
export const SENTRY_API_KEY =
  recording && process.env.SENTRY_API_KEY
    ? process.env.SENTRY_API_KEY
    : 'test-api-key'
export const SENTRY_ORGANIZATION =
  recording && process.env.SENTRY_ORGANIZATION
    ? process.env.SENTRY_ORGANIZATION
    : 'test-organization'
export const SENTRY_PROJECT =
  recording && process.env.SENTRY_PROJECT
    ? process.env.SENTRY_PROJECT
    : 'test-project'

const SENTRY_URL = `https://sentry.io/api/0/projects/${SENTRY_ORGANIZATION}/${SENTRY_PROJECT}` // eslint-disable-line max-len

export function cleanUpRelease(releaseVersion) {
  return request({
    url: `${SENTRY_URL}/releases/${releaseVersion}/`,
    method: 'DELETE',
    auth: {
      bearer: SENTRY_API_KEY
    }
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(
      `ERROR CLEANING UP RELEASE!
Release version: ${releaseVersion}
Status: ${err.statusCode}
Error: ${err.error}`
    )
  })
}

export function fetchRelease(version) {
  return request({
    url: `${SENTRY_URL}/releases/${version}/`,
    auth: {
      bearer: SENTRY_API_KEY
    },
    json: true
  })
}

export function fetchFiles(version) {
  return request({
    url: `${SENTRY_URL}/releases/${version}/files/`,
    auth: {
      bearer: SENTRY_API_KEY
    },
    json: true
  })
}
