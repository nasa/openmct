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
