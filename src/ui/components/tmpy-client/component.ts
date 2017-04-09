import Component, { tracked } from "@glimmer/component";

export default class TmpyClient extends Component {
  @tracked tmpyFiles = [
    { file: { name: "Gugus" } }
  ];

  onUpload(tmpyFiles) {
    console.log('onUpload', ...tmpyFiles)
    this.tmpyFiles = [
      ...this.tmpyFiles,
      ...tmpyFiles
    ];
  }
}
