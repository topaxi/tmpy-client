import Component from '@glimmer/component';
import Clipboard from 'clipboard/dist/clipboard';

export default class TmpyClipboard extends Component {
  args: { content: string };

  didInsertElement() {
    let clipboard = new Clipboard(this.element, {
      text: () => this.args.content
    });
  }
};
