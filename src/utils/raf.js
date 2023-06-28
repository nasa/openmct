export default function raf(callback) {
  let rendering = false;

  return () => {
    if (!rendering) {
      rendering = true;

      requestAnimationFrame(() => {
        callback();
        rendering = false;
      });
    }
  };
}
