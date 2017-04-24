export default function uniqid(): string {
  return `${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
}
