import Component, { tracked } from "@glimmer/component";
import { TMPY_CLIENT_ACTIONS } from '../../../utils/tmpy-client-actions';
import TmpyFile from '../../../utils/tmpy-file';
import blobToArrayBuffer from '../../../utils/blob-to-arraybuffer';

type NamedBuffer = { name: string, buffer: ArrayBuffer };

export interface FileUploadArgs {
  dispatchTmpyAction: (e: TMPY_CLIENT_ACTIONS) => void;
  zip: boolean;
}

interface ZipBuffer {
  type: 'zipbuffer';
  tmpyFileId: number;
  buffer: ArrayBuffer;
}
interface ZipProgress {
  type: 'zipprogress';
  tmpyFileId: number;
  currentFile: string | null;
  percent: number;
}
interface ZipError {
  type: 'ziperror';
  tmpyFileId: number;
  error: Error;
}

interface ZipWorkerMessageEvent extends MessageEvent {
  data: ZipBuffer | ZipProgress | ZipError
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
    if (files.length > 1 && this.args.zip) {
      let tmpyFile = new TmpyFile;

      this.args.dispatchTmpyAction({
        type: 'tmpy-file-upload-queue',
        data: { tmpyFiles: [ tmpyFile ] }
      });

      this.args.dispatchTmpyAction({
        type: 'tmpy-file-load-start',
        data: { tmpyFileId: tmpyFile.id }
      });

      let filesToZip: Promise<NamedBuffer>[] = [];

      let readFilesToZip = Array.from(files, file => () => {
        let buffer: Promise<NamedBuffer> =
          blobToArrayBuffer(file, e =>
            this.args.dispatchTmpyAction({
              type: 'tmpy-file-load-progress',
              data: {
                tmpyFileId: tmpyFile.id,
                currentFile: file.name,
                total: e.total,
                loaded: e.loaded
              }
            })
          )
          .then(buffer => ({ name: file.name, buffer }));
        filesToZip.push(buffer);
        return buffer;
      })

      readFilesToZip
        .reduce((p: Promise<any>, f) => p.then(f), Promise.resolve())
        .then(() => Promise.all(filesToZip))
        .then(filesToZip => {
          this.args.dispatchTmpyAction({
            type: 'tmpy-file-zip-start',
            data: { tmpyFileId: tmpyFile.id }
          });

          this.zipWorker.postMessage({
            tmpyFileId: tmpyFile.id,
            filesToZip
          }, filesToZip.map(f => f.buffer))
        })
    }
    else {
      let tmpyFiles = Array.from(files, file => new TmpyFile(file));

      this.args.dispatchTmpyAction({
        type: 'tmpy-file-upload-queue',
        data: { tmpyFiles }
      });
      this.args.dispatchTmpyAction({
        type: 'tmpy-file-upload-start',
        data: { tmpyFileIds: tmpyFiles.map(f => f.id) }
      });
    }
  }

  private startZipWorker(): void {
    this.zipWorker = new Worker('/assets/workers/zip-worker.js');

    this.zipWorker.onmessage = (e: ZipWorkerMessageEvent) => {
      if (e.data.type === 'zipbuffer') {
        return this.args.dispatchTmpyAction({
          type: 'tmpy-file-zip-complete',
          data: {
            tmpyFileId: e.data.tmpyFileId,
            buffer: e.data.buffer
          }
        });
      }
      else if (e.data.type === 'zipprogress') {
        return this.args.dispatchTmpyAction({
          type: 'tmpy-file-zip-progress',
          data: {
            tmpyFileId: e.data.tmpyFileId,
            percent: e.data.percent,
            currentFile: e.data.currentFile
          }
        });
      }
      else if (e.data.type === 'ziperror') {
        console.error(e.data.error);
      }
    }
  }
}
