export default function raf(callback) {
  let rendering = false;

  return (...args) => {
    if (!rendering) {
      rendering = true;

      requestAnimationFrame(() => {
        callback(...args);
        rendering = false;
      });
    }
  };
}
