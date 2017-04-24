import { tracked } from '@glimmer/component';
import TmpyFileProgress from './tmpy-file-progress';
import blobToArrayBuffer from './blob-to-arraybuffer';
import uniqid from './uniqid';

export default class TmpyFile {
  static toJSON(tmpyFile: TmpyFile) {
    return {
      id: tmpyFile.id,
      name: tmpyFile.name,
      size: tmpyFile.size,
      url: tmpyFile.url,
      progress: { type: tmpyFile.progress.type },
      completed: tmpyFile.completed,
      completed_at: tmpyFile.completed_at
    }
  }

  readonly id: string = uniqid();
  readonly progress: TmpyFileProgress = new TmpyFileProgress;

  @tracked name: string = '';
  @tracked size: number = 0;
  @tracked url: string | null = null;
  @tracked completed_at: number | null = null;

  private _file: File | null = null;

  @tracked
  get file(): File | null {
    return this._file;
  }
  set file(file: File | null) {
    this._file = file;

    if (file !== null) {
      this.name = file.name;
      this.size = file.size;
    }
  }

  @tracked('completed_at')
  get completed(): boolean {
    return Boolean(this.completed_at);
  }
  set completed(v: boolean) {
    this.file = null;
    this.progress.type = 'complete';
    this.completed_at = v ? Date.now() : null;
  }

  constructor(file: File | null = null) {
    this.file = file;
  }

  toJSON() {
    return TmpyFile.toJSON(this);
  }
}
