import { tracked } from '@glimmer/component';

export type TmpyFileProgressType =
  'queue' |
  'load' |
  'zip' |
  'upload' |
  'complete';

export default class TmpyFileProgress {
  @tracked percent: number = 0;
  @tracked currentFile: string | null = null;

  @tracked('_type')
  set type(t: TmpyFileProgressType) {
    this._type = t;
    this.percent = 0;
  }
  get type(): TmpyFileProgressType {
    return this._type;
  }

  @tracked
  private _type: TmpyFileProgressType = 'queue';

  fromEvent(e: { loaded: number, total: number }) {
    this.percent = Math.round(100 / e.total * e.loaded || 0);
  }
}
