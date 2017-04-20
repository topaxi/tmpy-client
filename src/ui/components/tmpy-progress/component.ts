import Component, { tracked } from '@glimmer/component';

export default class TmpyProgress extends Component {
  args: {
    max: number,
    value: number,
    percent: number
  }

  @tracked('args')
  get indeterminate(): boolean {
    return !this.args.percent && !this.args.max;
  }

  @tracked('args')
  get completed(): boolean {
    return this.args.value >= this.args.max;
  }
}
