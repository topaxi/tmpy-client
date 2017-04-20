import { tracked } from '@glimmer/component';
import TmpyFileProgress from './tmpy-file-progress';
import blobToArrayBuffer from '../utils/blob-to-arraybuffer';

let fileId = 0;

export type TransferableTmpyFile = {
  id: number;
  name: string;
  buffer: ArrayBuffer;
}

export default class TmpyFile {
  id: number = ++fileId;
  progress: TmpyFileProgress = new TmpyFileProgress;
  @tracked file: File | null = null;
  @tracked url: string | null = null;
  @tracked completed_at: number | null = null;

  @tracked('completed_at')
  get completed(): boolean {
    return Boolean(this.completed_at);
  }
  set completed(v: boolean) {
    this.completed_at = v ? Date.now() : null;
  }

  constructor(file: File | null = null) {
    this.file = file;
  }
}
