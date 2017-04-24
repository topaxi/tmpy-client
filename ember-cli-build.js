'use strict';

const GlimmerApp = require('@glimmer/application-pipeline').GlimmerApp;
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');

module.exports = function(defaults) {
  let app = new GlimmerApp(defaults, {
    sourcemaps: { enabled: false },
    rollup: {
      plugins: [
        resolve({ jsnext: true, module: true, main: true }),
        commonjs()
      ]
    }
  });

  let jszip = new Funnel('node_modules/jszip/dist', {
    destDir: '/assets/',
    include: [ 'jszip.min.js' ]
  });

  let workers = new Funnel('src/utils/workers', {
    destDir: '/assets/workers',
    include: [ '*.js' ]
  })

  return mergeTrees([ app.toTree(), jszip, workers ]);
};
