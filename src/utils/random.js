/**
 * Generates a pseudo-random number based on a seed.
 *
 * @param {number} seed - The seed value to generate the random number.
 * @returns {number} A pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
function seededRandom(seed = Date.now()) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export { seededRandom };
