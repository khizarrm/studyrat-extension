// Save this as utils/build-debug.js
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

console.log('Build output path:', config.output.path);
console.log('Build config:', JSON.stringify(config, null, 2));

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  })
);

console.log('Starting webpack build...');

webpack(config, function (err, stats) {
  if (err) {
    console.error('Webpack error:', err);
    throw err;
  }
  
  console.log('Build complete!');
  console.log(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }));
  
  // Check if build folder exists
  const buildPath = config.output.path;
  if (fs.existsSync(buildPath)) {
    console.log('\nBuild folder contents:');
    fs.readdirSync(buildPath).forEach(file => {
      console.log('  -', file);
    });
  } else {
    console.error('\nERROR: Build folder does not exist at:', buildPath);
  }
});