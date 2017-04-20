import Component, { tracked } from "@glimmer/component";
import { TMPY_CLIENT_ACTIONS } from '../../../utils/tmpy-client-actions';
import TmpyFile from '../../../utils/tmpy-file';
import blobToArrayBuffer from '../../../utils/blob-to-arraybuffer';

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

interface ZipWorkerMessageEvent extends MessageEvent {
  data: ZipBuffer | ZipProgress
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

      let tmpyFile = new TmpyFile;
      this.args.dispatchTmpyAction({
        type: 'tmpy-file-upload-queue',
        data: { tmpyFiles: [ tmpyFile ] }
      });

      Promise.all(filesToZip)
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
    }
  }
}
