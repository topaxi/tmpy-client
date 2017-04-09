import Component from "@glimmer/component";

export interface FileUploadArgs {
  onUpload: (files: any) => void;
}

export default class FileUpload extends Component {
  element: HTMLElement;
  args: FileUploadArgs;

  dragOver(e) {
    e.preventDefault();
  }

  dragEnter() {
    this.element.classList.add("drag-over");
  }

  dragLeave() {
    this.element.classList.remove("drag-over");
  }

  drop(e) {
    e.preventDefault();

    this.dragLeave();
    this.upload(e.dataTransfer.files);
  }

  inputChange(e) {
    this.upload(e.target.files);
    e.target.value = null;
  }

  stopImmediatePropagation(e: Event) {
    e.stopImmediatePropagation();
  }

  upload(files: File[]) {
    let tmpyFiles = files.map(file => ({ file }));
    this.args.onUpload(tmpyFiles);
  }
}
