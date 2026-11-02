const LOG_LEVEL = (typeof process !== 'undefined' && process.env && process.env.OPENMCT_LOG)
    || (typeof window !== 'undefined' && !!window.__OPENMCT_DEBUG__ && 'debug')
    || '';

export function info(...args) {
    console.info('[openmct]', ...args);
}
export function debug(...args) {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === true) {
        console.debug('[openmct][debug]', ...args);
    }
}

export function warn(...args) {
    console.warn('[openmct][warn]', ...args);
}

export function error(...args) {
    console.error('[openmct][error]', ...args);
}
