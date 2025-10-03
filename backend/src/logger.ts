const isProd = process.env.NODE_ENV === 'production';

export function info(...args: unknown[]) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function warn(...args: unknown[]) {
  // always log warnings in non-prod
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

export function error(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.error(...args);
}

export default { info, warn, error };
