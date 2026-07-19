/** The natural number `e`. */
export const e = Math.exp(1);

/**
Returns the logarithm of a number, using the given base or the natural number
`e` as base if not specified.
@param {number} n
@param {number=} base log base, defaults to e
*/
export function log(n, base = e) {
  if (base === e) {
    return Math.log(n);
  }

  return Math.log(n) / Math.log(base);
}

/**
Returns the inverse of the logarithm of a number, using the given base or the
natural number `e` as base if not specified.
@param {number} n
@param {number=} base log base, defaults to e
*/
export function antilog(n, base = e) {
  return Math.pow(base, n);
}

/**
A symmetric logarithm function. See https://github.com/nasa/openmct/issues/2297#issuecomment-1032914258
@param {number} n
@param {number=} base log base, defaults to e
*/
export function symlog(n, base = e) {
  return Math.sign(n) * log(Math.abs(n) + 1, base);
}

/**
An inverse symmetric logarithm function. See https://github.com/nasa/openmct/issues/2297#issuecomment-1032914258
@param {number} n
@param {number=} base log base, defaults to e
*/
export function antisymlog(n, base = e) {
  return Math.sign(n) * (antilog(Math.abs(n), base) - 1);
}
