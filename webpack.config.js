var path = require('path')

module.exports = {
	entry: path.resolve(__dirname, './src/index'),
	target: 'node',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'index.js',
		library: 'webpack-sentry-plugin',
		libraryTarget: 'umd',
	},
	module: {
		loaders: [{
			test: /\.js/,
			loader: 'babel',
			include: path.resolve(__dirname, 'src'),
			exclude: path.resolve(__dirname, 'node_modules')
		}]
	},
	externals: [
		'lodash',
		'request',
		'request-promise'
	],
	resolve: {
		extensions: ['.js', '']
	}
}