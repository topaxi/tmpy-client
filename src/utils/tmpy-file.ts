import { tracked } from '@glimmer/component';
import blobToArrayBuffer from '../utils/blob-to-arraybuffer';

let fileId = 0;

export type TransferableTmpyFile = {
  id: number;
  name: string;
  buffer: ArrayBuffer;
}

export default class TmpyFile {
  id: number = ++fileId;
  @tracked url: string | null = null;
  @tracked total: number = 0;
  @tracked loaded: number = 0;
  @tracked completed_at: number | null = null;

  @tracked('completed_at')
  get completed(): boolean {
    return Boolean(this.completed_at);
  }
  set completed(v: boolean) {
    this.completed_at = v ? Date.now() : null;
  }

  constructor(public file: File) {
  }

  toTransferable(): Promise<TransferableTmpyFile> {
    return blobToArrayBuffer(this.file)
      .then(buffer => {
        return { id: this.id, name: this.file.name, buffer };
      });
  }
}
