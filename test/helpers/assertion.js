import webpack from 'webpack'

// Work around Jest not having expect.fail()
export function expectNoFailure(msg) {
  return () => {
    throw new Error(msg)
  }
}

export function expectReleaseContainsFile(filename) {
  return (files) => {
    const filenames = files.map(({ name }) => name)
    expect(filenames).toContain(filename)

    return Promise.resolve(files)
  }
}

export function expectReleaseDoesNotContainFile(filename) {
  return (files) => {
    const filenames = files.map(({ name }) => name)
    expect(filenames).not.toContain(filename)

    return Promise.resolve(files)
  }
}

export function expectWebpackError(error, msg) {
  if (webpack.version.startsWith('5.')) {
    expect(error.message).toEqual(msg)
  }
  else {
    expect(error).toEqual(msg)
  }
}
