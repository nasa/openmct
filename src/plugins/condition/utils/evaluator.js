/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import { TRIGGER } from './constants.js';

/**
 * Evaluates an array of results based on a specified trigger condition.
 * @param {Array} results - The array of results to evaluate.
 * @param {TRIGGER} trigger - The trigger condition to apply for evaluation.
 * @returns {boolean} The result of the evaluation based on the trigger.
 */
function evaluateResults(results, trigger) {
  if (trigger && trigger === TRIGGER.XOR) {
    return matchExact(results, 1);
  } else if (trigger && trigger === TRIGGER.NOT) {
    return matchExact(results, 0);
  } else if (trigger && trigger === TRIGGER.ALL) {
    return matchAll(results);
  } else {
    return matchAny(results);
  }
}

/**
 * Checks if all elements in the results array are true.
 * @param {Array} results - The array of results to evaluate.
 * @returns {boolean} True if all elements are true, otherwise false.
 */
function matchAll(results) {
  for (let result of results) {
    if (result !== true) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if any element in the results array is true.
 * @param {Array} results - The array of results to evaluate.
 * @returns {boolean} True if any element is true, otherwise false.
 */
function matchAny(results) {
  for (let result of results) {
    if (result === true) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the number of true elements in the results array matches the target.
 * @param {Array} results - The array of results to evaluate.
 * @param {number} target - The target number of true elements to match.
 * @returns {boolean} True if the number of true elements matches the target, otherwise false.
 */
function matchExact(results, target) {
  let matches = 0;
  for (let result of results) {
    if (result === true) {
      matches++;
    }
    if (matches > target) {
      return false;
    }
  }
  return matches === target;
}

export { evaluateResults };
