export default function blobToArrayBuffer(blob: Blob | File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result)
    fileReader.onerror = reject
    fileReader.readAsArrayBuffer(blob);
  });
}
