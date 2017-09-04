const responses = {
  release: {
    'bad-release': () => Promise.reject(new Error('Release request error')),
    'bad-upload': () => Promise.resolve(),
  },
  upload: {
    'bad-upload': () => Promise.reject(new Error('Upload request error')),
  },
}

/* eslint-disable consistent-return */
function mockRequestPromise({ url, body }) {
  // Creating new release
  if (/releases\/$/.test(url)) {
    const { version } = JSON.parse(body)
    return responses.release[version]()
  }
  else {
    // Uploading file
    const matches = url.match(/releases\/(.*)\/files\/$/)
    if (matches) {
      const version = matches[1]
      return responses.upload[version]()
    }
  }
}
/* eslint-enable consistent-return */

export default jest
  .genMockFromModule('request-promise')
  .mockImplementation(mockRequestPromise)
