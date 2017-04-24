import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';
import Upload from '../../../utils/upload';
import { TMPY_CLIENT_ACTIONS } from '../../../utils/tmpy-client-actions';

const MAX_AGE = 15 * 60 * 1000;
const JANITOR_INTERVAL = 5 * 1000;

export default class TmpyClient extends Component {
  @tracked tmpyFiles: TmpyFile[];
  @tracked showScript: boolean = false;
  @tracked script: string;

  @tracked
  set enableZip(v: boolean) {
    localStorage.setItem('enableZip', JSON.stringify(v))
  }
  get enableZip(): boolean {
    return Boolean(JSON.parse(String(localStorage.getItem('enableZip'))));
  }

  private janitor: number;
  private _script: Promise<string>;

  constructor(options: object) {
    super(options);
    this.tmpyFiles = JSON.parse(localStorage.getItem('tmpyFiles') || '[]');
    this.runJanitor();
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
    this.startJanitor()
  }

  willDestroy() {
    this.stopJanitor()
  }

  dispatch(a: TMPY_CLIENT_ACTIONS): void {
    switch (a.type) {
      case 'tmpy-file-upload-queue': {
        this.tmpyFiles = [
          ...this.tmpyFiles,
          ...a.data.tmpyFiles
        ];
        break;
      }
      case 'tmpy-file-load-start': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.progress.type = 'load';
        }
        break;
      }
      case 'tmpy-file-load-progress': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.progress.fromEvent(a.data);
          tmpyFile.progress.currentFile = a.data.currentFile;
        }
        break;
      }
      case 'tmpy-file-load-complete': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.progress.type = 'queue';
        }
        break;
      }
      case 'tmpy-file-zip-start': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.progress.type = 'zip';
        }
        break;
      }
      case 'tmpy-file-zip-progress': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.progress.percent = Math.round(a.data.percent);
          tmpyFile.progress.currentFile = a.data.currentFile;
        }
        break;
      }
      case 'tmpy-file-zip-complete': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.file = new File([ a.data.buffer ], 'tmpy-archive.zip');
          tmpyFile.progress.currentFile = null;

          this.dispatch({
            type: 'tmpy-file-upload-start',
            data: { tmpyFileIds: [ a.data.tmpyFileId ] }
          });
        }
        break;
      }
      case 'tmpy-file-upload-start': {
        let files = this.tmpyFiles
          .filter(f => a.data.tmpyFileIds.indexOf(f.id) > -1)
        files.forEach(f => f.progress.type = 'upload')
        this.uploadFiles(files);
        break;
      }
      case 'tmpy-file-upload-progress': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.progress.fromEvent(a.data)
        }
        break;
      }
      case 'tmpy-file-upload-complete': {
        let tmpyFile = this.findTmpyFile(a.data.tmpyFileId);

        if (tmpyFile !== undefined) {
          tmpyFile.url = a.data.url;
          tmpyFile.completed = true;
          this.storeFiles();
        }
        break;
      }
    }
  }

  private stopJanitor() {
    clearInterval(this.janitor)
  }

  private startJanitor() {
    this.stopJanitor()

    this.janitor = setInterval(() => this.runJanitor(), JANITOR_INTERVAL)
  }

  private runJanitor() {
    let now = Date.now()
    let len = this.tmpyFiles.length

    this.tmpyFiles = this.tmpyFiles
      .filter(tf => !tf.completed || now - tf.completed_at! < MAX_AGE)

    if (len !== this.tmpyFiles.length) {
      this.storeFiles()
    }
  }

  private storeFiles() {
    localStorage.setItem('tmpyFiles',
      JSON.stringify(
        this.tmpyFiles
          .filter(tf => tf.completed)
          .map(TmpyFile.toJSON)));
  }

  private findTmpyFile(id: string): TmpyFile | void {
    return this.tmpyFiles.find(tmpyFile => tmpyFile.id === id);
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

    tmpyFile.progress.type = 'upload';

    new Upload(tmpyFile.file, {
      chunking: false,
      processResponse: xhr => xhr.responseText,
      progress: e => {
        let loaded = 0;
        let total = 0;

        if (e.lengthComputable) {
          loaded = e.loaded;
          total = e.total;
        }

        this.dispatch({
          type: 'tmpy-file-upload-progress',
          data: { tmpyFileId: tmpyFile.id, loaded, total }
        });
      }
    })
    .send()
    .then((url: string) =>
      this.dispatch({
        type: 'tmpy-file-upload-complete',
        data: { tmpyFileId: tmpyFile.id, url }
      })
    )
  }
}
