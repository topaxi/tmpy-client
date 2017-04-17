import { Dict } from '../../../utils/dict'

export default function percent(_: any, { max, value, precision = 0 }: Dict<number>): number {
  if (!max) return 0;

  return +(100 / max * value).toFixed(precision);
}
