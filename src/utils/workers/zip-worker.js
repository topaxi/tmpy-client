self.importScripts('/assets/jszip.min.js');

self.onmessage = function(e/*: MessageEvent*/) {
  var zip = new JSZip;

  for (var i = 0; i < e.data.length; i++) {
    zip.file(e.data[i].name, e.data[i].buffer)
  }

  zip.generateAsync({ type: 'arraybuffer' })
    .then(function(buffer) {
      self.postMessage({ buffer: buffer }, [ buffer ]);
    });
}

