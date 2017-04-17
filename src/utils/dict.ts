export interface Dict<T> {
  [index: string]: T;
}

export function dict<T>(): Dict<T> {
  return Object.create(null) as Dict<T>;
}
