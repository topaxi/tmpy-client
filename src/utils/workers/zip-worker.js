self.importScripts('/assets/jszip.min.js');

self.onmessage = function(e/*: MessageEvent*/) {
  var zip = new JSZip;

  for (var i = 0; i < e.data.filesToZip.length; i++) {
    zip.file(e.data.filesToZip[i].name, e.data.filesToZip[i].buffer)
  }

  zip.generateAsync({ type: 'arraybuffer' }, ({ currentFile, percent }) => {
    self.postMessage({
      type: 'zipprogress',
      tmpyFileId: e.data.tmpyFileId,
      currentFile: currentFile,
      percent: percent
    });
  })
    .then(function(buffer) {
      self.postMessage({
        type: 'zipbuffer',
        tmpyFileId: e.data.tmpyFileId,
        buffer: buffer
      }, [ buffer ]);
    });
}
