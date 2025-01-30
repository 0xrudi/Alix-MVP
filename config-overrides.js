const webpack = require('webpack');

module.exports = function override(config) {
  // Add polyfill fallbacks
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "process/browser": require.resolve("process/browser"),
    "process": require.resolve("process/browser"),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "url": require.resolve("url/"),
    "buffer": require.resolve("buffer/"),
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ];

  // Return the modified config
  return config;
};