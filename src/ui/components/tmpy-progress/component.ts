import Component, { tracked } from '@glimmer/component';

export default class TmpyProgress extends Component {
  args: {
    max: number,
    value: number
  }

  @tracked('args')
  get indeterminate(): boolean {
    return !this.args.max;
  }

  @tracked('args')
  get completed(): boolean {
    return this.args.value >= this.args.max;
  }
}
