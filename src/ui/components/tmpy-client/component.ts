import Component, { tracked } from "@glimmer/component";
import TmpyFile from '../../../utils/tmpy-file';

export default class TmpyClient extends Component {
  @tracked tmpyFiles: TmpyFile[] = [];

  onUpload(tmpyFiles: TmpyFile[]) {
    this.tmpyFiles = [
      ...this.tmpyFiles,
      ...tmpyFiles
    ];
  }
}
