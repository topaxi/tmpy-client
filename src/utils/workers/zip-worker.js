'use strict';

self.importScripts('/assets/jszip.min.js');

var ONE_FRAME = 1000 / 60;
var ZIP_OPTIONS = {
  type: 'arraybuffer'
};

self.onmessage = function(e/*: MessageEvent*/) {
  var zip = new JSZip;
  var time = performance.now();
  var tmpyFileId = e.data.tmpyFileId;

  for (var i = 0; i < e.data.filesToZip.length; i++) {
    zip.file(e.data.filesToZip[i].name, e.data.filesToZip[i].buffer);
  }

  zip.generateAsync(ZIP_OPTIONS, function onZipUpdate(meta) {
    var now = performance.now();

    if ((time + ONE_FRAME - now) <= 0) {
      self.postMessage({
        type: 'zipprogress',
        tmpyFileId: tmpyFileId,
        currentFile: meta.currentFile,
        percent: meta.percent
      });
      time = now;
    }
  })
    .then(function onZipComplete(buffer) {
      self.postMessage({
        type: 'zipprogress',
        tmpyFileId: tmpyFileId,
        currentFile: null,
        percent: 100
      });
      self.postMessage({
        type: 'zipbuffer',
        tmpyFileId: tmpyFileId,
        buffer: buffer
      }, [ buffer ]);
    })
    .catch(function onZipError(error) {
      self.postMessage({
        type: 'ziperror',
        tmpyFileId: tmpyFileId,
        error: error
      });
    });
}
