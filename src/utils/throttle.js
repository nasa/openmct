/**
 * Creates a throttled function that only invokes the provided function at most once every
 * specified number of milliseconds. Subsequent calls within the waiting period will be ignored.
 * @param {Function} func The function to throttle.
 * @param {number} wait The number of milliseconds to wait between successive calls to the function.
 * @return {Function} Returns the new throttled function.
 */
export default function throttle(func, wait) {
  let waiting = false;
  let lastArgs = null;

  // If the function was invoked while we were waiting, call it with those arguments
  // If it wasn't called when we were waiting, we're done
  function checkFunctionInvokedOrStopWaiting() {
    if (lastArgs !== null) {
      func(...lastArgs);
      lastArgs = null;
      setTimeout(checkFunctionInvokedOrStopWaiting, wait);
    } else {
      waiting = false;
    }
  }

  return function (...args) {
    // if we're waiting (in between calls), store the arguments to use for when we call the function after we're done waiting
    if (waiting) {
      lastArgs = args;
      return;
    }

    // if we're not waiting (between calls), call the function and wait
    func(...args);
    waiting = true;
    // when we're done waiting, now check if the function was invoked while we were waiting
    setTimeout(checkFunctionInvokedOrStopWaiting, wait);
  };
}
