export function log(...args) {
  return console.log('[LOG]', ...args);
}
export function error(...args) {
  return console.error('[ERROR]', ...args);
}
