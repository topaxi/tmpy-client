export default function blobToArrayBuffer(blob: Blob, onUpdate?: (e: ProgressEvent) => any): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result)
    if (onUpdate) fileReader.onprogress = onUpdate;
    fileReader.onerror = reject
    fileReader.readAsArrayBuffer(blob);
  });
}
