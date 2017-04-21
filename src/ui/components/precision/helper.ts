export default function precision([ n, p ]: [ number, number ]): string {
  return Number(n).toFixed(p);
}
