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

/**
 * StateGeneratorProvider class provides methods to support subscription and request for state generation.
 */
class StateGeneratorProvider {
  /**
   * Determines if the StateGeneratorProvider supports subscription for the given domain object.
   *
   * @param {Object} domainObject - The domain object to check.
   * @returns {boolean} True if supports subscription, false otherwise.
   */
  supportsSubscribe(domainObject) {
    return domainObject.type === 'example.state-generator';
  }

  /**
   * Subscribes to updates for the given domain object.
   *
   * @param {Object} domainObject - The domain object to subscribe to.
   * @param {Function} callback - The callback to invoke with new data.
   * @returns {Function} A function to unsubscribe from updates.
   */
  subscribe(domainObject, callback) {
    const duration = domainObject.telemetry.duration * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      const datum = pointForTimestamp(now, duration, domainObject.name);
      datum.value = String(datum.value);
      callback(datum);
    }, duration);

    return function unsubscribe() {
      clearInterval(interval);
    };
  }

  /**
   * Determines if the StateGeneratorProvider supports request for the given domain object.
   *
   * @param {Object} domainObject - The domain object to check.
   * @param {Object} options - Request options.
   * @returns {boolean} True if supports request, false otherwise.
   */
  supportsRequest(domainObject, options) {
    return domainObject.type === 'example.state-generator';
  }

  /**
   * Handles data requests for the given domain object.
   *
   * @param {Object} domainObject - The domain object to request data for.
   * @param {Object} options - Request options including start and end times.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of data points.
   */
  request(domainObject, options) {
    let start = options.start;
    const end = Math.min(Date.now(), options.end); // no future values
    const duration = domainObject.telemetry.duration * 1000;
    if (options.strategy === 'latest' || options.size === 1) {
      start = end;
    }

    const data = [];
    while (start <= end && data.length < 5000) {
      data.push(pointForTimestamp(start, duration, domainObject.name));
      start += duration;
    }

    return Promise.resolve(data);
  }
}

/**
 * Generates a telemetry point for a given timestamp.
 *
 * @param {number} timestamp - The timestamp for generating the point.
 * @param {number} duration - The duration between points.
 * @param {string} name - The name of the telemetry point.
 * @returns {Object} The telemetry data point.
 */
function pointForTimestamp(timestamp, duration, name) {
  return {
    name,
    utc: Math.floor(timestamp / duration) * duration,
    value: Math.floor(timestamp / duration) % 2
  };
}

export default StateGeneratorProvider;
