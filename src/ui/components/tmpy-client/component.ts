import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';

const MAX_AGE = 15 * 60 * 1000;
const JANITOR_INTERVAL = 5 * 1000;

export default class TmpyClient extends Component {
  @tracked tmpyFiles: TmpyFile[] = [];

  private janitor: number;

  onUpload(tmpyFiles: TmpyFile[]) {
    this.tmpyFiles = [
      ...this.tmpyFiles,
      ...tmpyFiles
    ];
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
