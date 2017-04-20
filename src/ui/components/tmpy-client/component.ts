import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';
import Upload from '../../../utils/upload';
import { TMPY_CLIENT_ACTIONS } from '../../../utils/tmpy-client-actions';

const MAX_AGE = 15 * 60 * 1000;
const JANITOR_INTERVAL = 5 * 1000;

export default class TmpyClient extends Component {
  @tracked tmpyFiles: TmpyFile[] = [];
  @tracked showScript: boolean = false;
  @tracked script: string;
  @tracked enableZip: boolean = false;

  private janitor: number;
  private _script: Promise<string>;

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

  dispatch(a: TMPY_CLIENT_ACTIONS): void {
    switch (a.type) {
      case 'tmpy-file-upload-queue':
        this.tmpyFiles = [
          ...this.tmpyFiles,
          ...a.data.tmpyFiles
        ];
        break;
      case 'tmpy-file-zip-start':
        // Nothing to do here
        break;
      case 'tmpy-file-zip-progress': {
        let tmpyFile = this.tmpyFiles.find(tmpyFile =>
          tmpyFile.id === a.data.tmpyFileId
        );

        if (tmpyFile) {
          tmpyFile.progress.zipProgress = Math.round(a.data.percent);
          tmpyFile.progress.zipCurrentFile = a.data.currentFile;
        }
        break;
      }
      case 'tmpy-file-zip-complete': {
        let tmpyFile = this.tmpyFiles.find(tmpyFile =>
          tmpyFile.id === a.data.tmpyFileId
        );

        if (tmpyFile) {
          tmpyFile.file = new File([ a.data.buffer ], 'tmpy-archive.zip');
          tmpyFile.progress.zipComplete = true;
          this.dispatch({
            type: 'tmpy-file-upload-start',
            data: { tmpyFileIds: [ a.data.tmpyFileId ] }
          });
        }
        break;
      }
      case 'tmpy-file-upload-start':
        this.uploadFiles(
          this.tmpyFiles
            .filter(f => a.data.tmpyFileIds.indexOf(f.id) > -1)
        );
        break;
      case 'tmpy-file-upload-progress':
        // Update upload progress
        break;
      case 'tmpy-file-upload-complete':
        // Set url={{url}} and completed=true
        break;
    }
  }

  private uploadFiles(tmpyFiles: TmpyFile[]): void {
    tmpyFiles.forEach(tmpyFile =>
      this.uploadFile(tmpyFile)
    );
  }

  private uploadFile(tmpyFile: TmpyFile): void {
    if (!tmpyFile.file) {
      throw new Error('File not found!');
    }

    tmpyFile.progress.uploadStarted = true;

    new Upload(tmpyFile.file, {
      chunking: false,
      processResponse: xhr => xhr.responseText,
      progress(e) {
        if (e.lengthComputable) {
          tmpyFile.progress.uploadLoaded = e.loaded;
          tmpyFile.progress.uploadTotal = e.total;
        }
        else {
          tmpyFile.progress.uploadLoaded = 0;
          tmpyFile.progress.uploadTotal = 0;
        }
      }
    })
    .send()
    .then((url: string) =>
      Object.assign(tmpyFile, { url, completed: true })
    )
  }
}
