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
 * @typedef {Object} IndicatorState
 * An object defining the visible state of the indicator.
 * @property {string} statusClass - The class to apply to the indicator.
 * @property {string} text - The text to display in the indicator.
 * @property {string} description - The description to display in the indicator.
 */

/**
 * Set of CouchDB connection states; changes among these states will be
 * reflected in the indicator's appearance.
 * CONNECTED: Everything nominal, expect to be able to read/write.
 * DISCONNECTED: HTTP request failed (network error). Unable to reach server at all.
 * PENDING: Still trying to connect, and haven't failed yet.
 * MAINTENANCE: CouchDB is connected but not accepting requests.
 */

/** @type {IndicatorState} */
export const CONNECTED = {
  statusClass: 's-status-on',
  text: 'CouchDB is connected',
  description: 'CouchDB is online and accepting requests.'
};
/** @type {IndicatorState} */
export const PENDING = {
  statusClass: 's-status-warning-lo',
  text: 'Attempting to connect to CouchDB...',
  description: 'Checking status of CouchDB, please stand by...'
};
/** @type {IndicatorState} */
export const DISCONNECTED = {
  statusClass: 's-status-warning-hi',
  text: 'CouchDB is offline',
  description: 'CouchDB is offline and unavailable for requests.'
};
/** @type {IndicatorState} */
export const UNKNOWN = {
  statusClass: 's-status-info',
  text: 'CouchDB connectivity unknown',
  description: 'CouchDB is in an unknown state of connectivity.'
};

export default class CouchStatusIndicator {
  constructor(simpleIndicator) {
    this.indicator = simpleIndicator;
    this.#setDefaults();
  }

  /**
   * Set the default values for the indicator.
   * @private
   */
  #setDefaults() {
    this.setIndicatorToState(PENDING);
  }

  /**
   * Set the indicator to the given state.
   * @param {IndicatorState} state
   */
  setIndicatorToState(state) {
    this.indicator.text(state.text);
    this.indicator.description(state.description);
    this.indicator.statusClass(state.statusClass);
  }
}
