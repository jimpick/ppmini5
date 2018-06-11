const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: {
    app: ['babel-regenerator-runtime', './index.web.js'],
  },
  output: {
    path: path.resolve(__dirname, 'desktop', 'dist'),
    filename: 'bundle.js',
    publicPath: 'dist/'
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      }
    ],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-electron',
    },
    extensions: ['.web.js', '.js', '.json'],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
    }),
    new webpack.ContextReplacementPlugin(
      /node-gyp-build/,
      path.resolve(__dirname, 'node_modules/utp-native/prebuilds/'),
      {
        [path.resolve(__dirname, 'node_modules/utp-native/prebuilds/darwin-x64/electron-57.node')]: './darwin-x64/electron-57.node'
      }
    )
  ],
  target: 'electron-renderer',
}
