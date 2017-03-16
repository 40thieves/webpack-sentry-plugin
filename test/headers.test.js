import { createWebpackConfig, runWebpack } from './helpers/webpack'
import {
	expectNoFailure,
} from './helpers/assertion'
const _ = require('lodash')
const matchers = require('jest-matchers/build/matchers');
const SourceMapDevToolPlugin = require('webpack/lib/SourceMapDevToolPlugin')

expect.extend({
    toHaveBeenCalledWithObject(received, argument) {
        if (received.mock.calls.length == 0) {
            return {
                message: () => "Function has not been called",
                pass: false
            }
        }

        const passed = _.some(received.mock.calls, (args) => {
            if (!args[0]) {
                return false;
            }

            let match = matchers.toMatchObject(
                args[0],
                argument
            );
            return match.pass;
        })

        return {
            message: () => ("Arguments did not match the template"),
            pass: passed
        }
    }
})

describe('uploading with correct headers', () => {
	const release = 'successful-upload'
    const request = require('request-promise')

	beforeEach(() => {
		request.default.mockClear();
	})

	it('uploads source with correct headers with devtool: hidden-source-map', () => {
		return runWebpack(createWebpackConfig({ release }, { devtool: 'hidden-source-map'}))
			.then(() => {
				const mock = request.default.mock;
				expect(request.default)
                    .toHaveBeenCalledWithObject({
                        headers: {
                            sourcemap: 'index.bundle.js.map'
                        }
                    });
			})
	})

    it('uploads source with correct headers with devtool: source-map', () => {
		return runWebpack(createWebpackConfig({ release }, { devtool: 'source-map'}))
			.then(() => {
				const mock = request.default.mock;
				expect(request.default)
                    .toHaveBeenCalledWithObject({
                        headers: {
                            sourcemap: 'index.bundle.js.map'
                        }
                    });
			})
	})

    it('uploads source with correct headers with SourceMapDevToolPlugin', () => {
        const webpackConfig = createWebpackConfig({ release });
        delete webpackConfig.devtool;
        webpackConfig.plugins.push(new SourceMapDevToolPlugin({
            filename: 'renamed-the-sourcemap.map'
        }));
		return runWebpack(webpackConfig)
			.then(() => {
				const mock = request.default.mock;
				expect(request.default)
                    .toHaveBeenCalledWithObject({
                        headers: {
                            sourcemap: 'renamed-the-sourcemap.map'
                        }
                    });
			})
	})

    it('uploads source with correct headers with output.sourceMapFilename', () => {
        const webpackConfig = createWebpackConfig({ release });
        webpackConfig.output.sourceMapFilename = 'renamed-the-sourcemap.map';
        
		return runWebpack(webpackConfig)
			.then(() => {
				const mock = request.default.mock;
				expect(request.default)
                    .toHaveBeenCalledWithObject({
                        headers: {
                            sourcemap: 'renamed-the-sourcemap.map'
                        }
                    });
			})
	})
})
