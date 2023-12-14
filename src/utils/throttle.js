/**
 * Creates a throttled function that only invokes the provided function at most once every
 * specified number of milliseconds. Subsequent calls within the waiting period will be ignored.
 * @param {Function} func The function to throttle.
 * @param {number} wait The number of milliseconds to wait between successive calls to the function.
 * @return {Function} Returns the new throttled function.
 */
export default function throttle(func, wait) {
  let timeout;
  let result;
  let previous = 0;

  return function (...args) {
    const now = new Date().getTime();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      result = func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = new Date().getTime();
        timeout = null;
        result = func(...args);
      }, remaining);
    }
    return result;
  };
}
