import { tracked } from '@glimmer/component';

export default class TmpyFileProgress {
  @tracked zipProgress: number = 0;
  @tracked zipComplete: boolean = false;
  @tracked zipCurrentFile: string | null = null;
  @tracked uploadStarted: boolean = false;
  @tracked uploadLoaded: number = 0;
  @tracked uploadTotal: number = 0;

  @tracked(
    'zipComplet',
    'zipProgress',
    'uploadStarted',
    'uploadLoaded',
    'uploadTotal'
  )
  get percent(): number {
    if (this.zipComplete || this.uploadStarted) {
      return Math.round(100 / this.uploadTotal * this.uploadLoaded) || 0;
    }

    return this.zipProgress;
  }
}
