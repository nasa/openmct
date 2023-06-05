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

class Ticker {
  constructor() {
    this.callbacks = [];
    this.last = new Date() - 1000;
  }

  /**
   * Calls functions every second, as close to the actual second
   * tick as is feasible.
   * @constructor
   * @memberof utils/clock
   */
  tick() {
    const timestamp = new Date();
    const millis = timestamp % 1000;

    // Only update callbacks if a second has actually passed.
    if (timestamp >= this.last + 1000) {
      this.callbacks.forEach(function (callback) {
        callback(timestamp);
      });
      this.last = timestamp - millis;
    }

    // Try to update at exactly the next second
    this.timeoutHandle = setTimeout(
      () => {
        this.tick();
      },
      1000 - millis,
      true
    );
  }

  /**
   * Listen for clock ticks. The provided callback will
   * be invoked with the current timestamp (in milliseconds
   * since Jan 1 1970) at regular intervals, as near to the
   * second boundary as possible.
   *
   * @param {Function} callback callback to invoke
   * @returns {Function} a function to unregister this listener
   */
  listen(callback) {
    if (this.callbacks.length === 0) {
      this.tick();
    }

    this.callbacks.push(callback);

    // Provide immediate feedback
    callback(this.last);

    // Provide a deregistration function
    return () => {
      this.callbacks = this.callbacks.filter(function (cb) {
        return cb !== callback;
      });

      if (this.callbacks.length === 0) {
        clearTimeout(this.timeoutHandle);
      }
    };
  }
}

let ticker = new Ticker();

export default ticker;
