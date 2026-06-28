/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
