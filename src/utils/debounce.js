export default function debounce(func, delay) {
  let debounceTimer;

  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  };
}
