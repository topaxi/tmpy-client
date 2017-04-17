import Component, { tracked } from '@glimmer/component';

declare class Clipboard {
  constructor(selector: string | Element | NodeListOf<Element>, options?: Clipboard.Options);

  on(type: "success" | "error", handler: (e: Clipboard.Event) => void): this;
  on(type: string, handler: (...args: any[]) => void): this;

  destroy(): void;
}

declare namespace Clipboard {
  interface Options {
    action?(elem: Element): string;
    target?(elem: Element): Element;
    text?(elem: Element): string;
  }

  interface Event {
    action: string;
    text: string;
    trigger: Element;
    clearSelection(): void;
  }
}

const TOOLTIP_TIMEOUT = 1000;

export default class TmpyClipboard extends Component {
  args: { content: string };
  element: HTMLButtonElement;

  @tracked tooltip: string | null = null;

  private clipboard: Clipboard;

  didInsertElement() {
    this.clipboard = new Clipboard(this.element, {
      text: () => {
        return this.args.content;
      }
    })

    this.clipboard.on('success', () => {
      this.tooltip = 'Copied!';

      setTimeout(() => this.tooltip = null, TOOLTIP_TIMEOUT);
    })

    this.clipboard.on('error', e => {
      this.tooltip = this.fallbackMessage(e.action);

      setTimeout(() => this.tooltip = null, TOOLTIP_TIMEOUT);
    })
  }

  willDestroy() {
    this.clipboard.destroy()
  }

  private fallbackMessage(action: string): string {
    let actionMsg = ''
    let actionKey = action === 'cut' ? 'X' : 'C'

    if (/iPhone|iPad/i.test(navigator.userAgent)) {
      actionMsg = 'No support :('
    }
    else if (/Mac/i.test(navigator.userAgent)) {
      actionMsg = `Press ⌘-${actionKey} to ${action}`
    }
    else {
      actionMsg = `Press Ctrl-${actionKey} to ${action}`
    }

    return actionMsg
  }
};
