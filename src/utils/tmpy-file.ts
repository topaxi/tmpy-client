import { tracked } from '@glimmer/component';

export default class TmpyFile {
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
}
