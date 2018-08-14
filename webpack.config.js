const path = require('path')
// https://webpack.js.org/plugins/uglifyjs-webpack-plugin/#src/components/Sidebar/Sidebar.jsx
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

babelOptions = {
    presets: ['es2017'],
    // presets: ['babel-preset-env'],
    plugins: [
        // fix for regeneratorRuntime undefined
        ['transform-runtime', {
            polyfill: false,
            regenerator: true
        }]
    ]
}

module.exports = {
    entry: {
        'alpha-video': './lib/alpha-video.js',
    },
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                use: [{
                    loader: 'babel-loader',
                    options: babelOptions
                }],
                exclude: [
                    // instead of /\/node_modules\//
                    path.join(process.cwd(), 'node_modules')
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                test: /\.js($|\?)/i
            })
        ]
    },
}