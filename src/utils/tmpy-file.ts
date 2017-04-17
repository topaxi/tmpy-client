import { tracked } from '@glimmer/component';

export default class TmpyFile {
  @tracked url: string | null = null;
  @tracked total: number = 0;
  @tracked loaded: number = 0;
  @tracked completed: boolean = false;

  @tracked('total', 'loaded')
  get progress() {
    if (this.total === 0) return 0;

    return 100 / this.total * this.loaded;
  }

  constructor(public file: File) {
  }
}
