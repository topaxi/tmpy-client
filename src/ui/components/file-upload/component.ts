import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';
import Upload from '../../../utils/upload';
import blobToArrayBuffer from '../../../utils/blob-to-arraybuffer';

export interface FileUploadArgs {
  onUpload: (files: TmpyFile[]) => void;
  zip: boolean;
}

const MAX_CONCURRENCY = 4;

export default class FileUpload extends Component {
  element: HTMLElement;
  args: FileUploadArgs;

  @tracked isDragOver = false;

  private zipWorker: Worker;

  didInsertElement(): void {
    this.startZipWorker();
  }

  willDestroy(): void {
    this.zipWorker.terminate();
  }

  dragOver(e: Event): void {
    e.preventDefault();
  }

  dragEnter(): void {
    this.element.classList.add("drag-over");
  }

  dragLeave(): void {
    this.element.classList.remove("drag-over");
  }

  drop(e: DragEvent): void {
    e.preventDefault();

    this.dragLeave();
    this.upload(e.dataTransfer.files);
  }

  inputChange(e: Event): void {
    let input = e.target as HTMLInputElement;
    if (input.files) {
      this.upload(input.files);
    }
    input.value = '';
  }

  stopImmediatePropagation(e: Event): void {
    e.stopImmediatePropagation();
  }

  upload(files: FileList): void {
    if (this.args.zip) {
      let filesToZip = Array.from(files, file =>
        blobToArrayBuffer(file)
          .then(buffer => ({ name: file.name, buffer }))
      )

      Promise.all(filesToZip)
        .then(filesToZip => {
          this.zipWorker.postMessage(filesToZip, filesToZip.map(f => f.buffer))
        })
    }
    else {
      let tmpyFiles = Array.from(files, file => new TmpyFile(file));

      this.uploadFiles(tmpyFiles);
      this.args.onUpload(tmpyFiles);
    }
  }

  uploadFiles(tmpyFiles: TmpyFile[]): void {
    tmpyFiles.forEach(tmpyFile =>
      new Upload(tmpyFile.file, {
        chunking: false,
        processResponse: xhr => xhr.responseText,
        progress(e) {
          if (e.lengthComputable) {
            tmpyFile.loaded = e.loaded;
            tmpyFile.total = e.total;
          }
          else {
            tmpyFile.loaded = 0;
            tmpyFile.total = 0;
          }
        }
      })
        .send()
        .then((url: string) =>
          Object.assign(tmpyFile, { url, completed: true })
        )
    );
  }

  private startZipWorker(): void {
    this.zipWorker = new Worker('/assets/workers/zip-worker.js');

    this.zipWorker.onmessage = (e: MessageEvent) => {
      let file = new File([ e.data.buffer ], 'tmpy-archive.zip');
      let tmpyFile = new TmpyFile(file);
      this.args.onUpload([ tmpyFile ]);

      new Upload(tmpyFile.file, {
        chunking: false,
        processResponse: xhr => xhr.responseText,
        progress(e) {
          if (e.lengthComputable) {
            tmpyFile.loaded = e.loaded;
            tmpyFile.total = e.total;
          }
          else {
            tmpyFile.loaded = 0;
            tmpyFile.total = 0;
          }
        }
      })
        .send()
        .then((url: string) =>
          Object.assign(tmpyFile, { url, completed: true })
        )
    }
  }
}
