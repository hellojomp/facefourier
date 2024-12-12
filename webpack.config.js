const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  devtool: 'source-map', // or 'hidden-source-map' for production
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  mode: 'production',
  entry: './src/script.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          }
        }
      }
    ]
  },
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/")
    }
  }
};