import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';

const MAX_AGE = 15 * 60 * 1000;
const JANITOR_INTERVAL = 5 * 1000;

export default class TmpyClient extends Component {
  @tracked tmpyFiles: TmpyFile[] = [];
  @tracked showScript: boolean = false;
  @tracked script: string;
  @tracked enableZip: boolean = false;

  private janitor: number;
  private _script: Promise<string>;

  onUpload(tmpyFiles: TmpyFile[]) {
    this.tmpyFiles = [
      ...this.tmpyFiles,
      ...tmpyFiles
    ];
  }

  setEnableZip(e: Event): void {
    this.enableZip = (e.target as HTMLInputElement).checked;
  }

  toggleScript() {
    this.showScript = Boolean(this.script) && !this.showScript;

    if (!this._script) {
      this._script = fetch('/tmpy.sh')
        .then(res => res.text());
      this._script.then(() => this.showScript = true);
    }

    this._script.then(s => {
      this.script = s;
    });
  }

  stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  didInsertElement() {
    this.janitor = setInterval(() => {
      let now = Date.now()

      this.tmpyFiles = this.tmpyFiles
        .filter(tf => !tf.completed || now - tf.completed_at! < MAX_AGE)
    }, JANITOR_INTERVAL)
  }

  willDestroy() {
    clearInterval(this.janitor)
  }
}
