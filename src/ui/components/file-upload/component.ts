import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';
import Upload from '../../../utils/upload';
// import { ISubscription } from 'rxjs/Subscription';
// import { Observable } from 'rxjs/Observable';
// import { Subject } from 'rxjs/Subject';
// import 'rxjs/add/observable/defer';
// import 'rxjs/add/observable/of';
// import 'rxjs/add/observable/fromPromise';
// import 'rxjs/add/operator/do';
// import 'rxjs/add/operator/map';
// import 'rxjs/add/operator/mergeMap';
// import 'rxjs/add/operator/mergeAll';

export interface FileUploadArgs {
  onUpload: (files: any) => void;
}

const MAX_CONCURRENCY = 4;

export default class FileUpload extends Component {
  element: HTMLElement;
  args: FileUploadArgs;

  @tracked isDragOver = false;

  // private sub: ISubscription;
  // private uploadQueue = new Subject<TmpyFile>();
  // private uploader = this.uploadQueue
  //   .map(Observable.of)
  //   .mergeAll(MAX_CONCURRENCY)
  //   .do((tmpyFile: TmpyFile) => console.log({ tmpyFile }))
  //   .mergeMap((tmpyFile: TmpyFile) =>
  //     Observable.fromPromise(
  //       new Upload(tmpyFile.file, {
  //         chunking: false,
  //         processResponse: xhr => xhr.responseText,
  //         progress(e) {
  //           if (e.lengthComputable) {
  //             tmpyFile.loaded = e.loaded;
  //             tmpyFile.total = e.total;
  //           }
  //           else {
  //             tmpyFile.loaded = 0;
  //             tmpyFile.total = 0;
  //           }
  //         }
  //       })
  //         .send()
  //         .then((url: string) =>
  //           Object.assign(tmpyFile, { url, completed: true })
  //         )
  //     )
  //   )
  //
  // didInsertElement() {
  //   this.sub = this.uploader.subscribe();
  // }
  //
  // willDestroy() {
  //   this.sub.unsubscribe();
  // }

  dragOver(e: Event) {
    e.preventDefault();
  }

  dragEnter() {
    this.element.classList.add("drag-over");
  }

  dragLeave() {
    this.element.classList.remove("drag-over");
  }

  drop(e: DragEvent) {
    e.preventDefault();

    this.dragLeave();
    this.upload(e.dataTransfer.files);
  }

  inputChange(e: Event) {
    let input = e.target as HTMLInputElement;
    if (input.files) {
      this.upload(input.files);
    }
    input.value = '';
  }

  stopImmediatePropagation(e: Event) {
    e.stopImmediatePropagation();
  }

  upload(files: FileList) {
    let tmpyFiles = Array.from(files, file => new TmpyFile(file));
    this.args.onUpload(tmpyFiles);

    tmpyFiles.forEach(tmpyFile =>
      new Upload(tmpyFile.file, {
        chunking: false,
        processResponse: xhr => xhr.responseText,
        progress(e) {
          if (e.lengthComputable) {
            tmpyFile.loaded = e.loaded;
            tmpyFile.total = e.total;
          }
          else {
            tmpyFile.loaded = 0;
            tmpyFile.total = 0;
          }
        }
      })
        .send()
        .then((url: string) =>
          Object.assign(tmpyFile, { url, completed: true })
        )
    );
  }
}
