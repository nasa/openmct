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

import TimeContext from './TimeContext';

/**
 * The GlobalContext handles getting and setting time of the openmct application in general.
 * Views will use this context unless they specify an alternate/independent time context
 */
class GlobalTimeContext extends TimeContext {
  constructor() {
    super();

    //The Time Of Interest
    this.toi = undefined;
  }

  /**
   * Get or set the start and end time of the time conductor. Basic validation
   * of bounds is performed.
   *
   * @param {module:openmct.TimeAPI~TimeConductorBounds} newBounds
   * @throws {Error} Validation error
   * @fires module:openmct.TimeAPI~bounds
   * @returns {module:openmct.TimeAPI~TimeConductorBounds}
   * @memberof module:openmct.TimeAPI#
   * @method bounds
   */
  bounds(newBounds) {
    if (arguments.length > 0) {
      super.bounds.call(this, ...arguments);
      // If a bounds change results in a TOI outside of the current
      // bounds, unset it
      if (this.toi < newBounds.start || this.toi > newBounds.end) {
        this.timeOfInterest(undefined);
      }
    }

    //Return a copy to prevent direct mutation of time conductor bounds.
    return JSON.parse(JSON.stringify(this.boundsVal));
  }

  /**
   * Update bounds based on provided time and current offsets
   * @private
   * @param {number} timestamp A time from which bounds will be calculated
   * using current offsets.
   */
  tick(timestamp) {
    super.tick.call(this, ...arguments);

    // If a bounds change results in a TOI outside of the current
    // bounds, unset it
    if (this.toi < this.boundsVal.start || this.toi > this.boundsVal.end) {
      this.timeOfInterest(undefined);
    }
  }

  /**
   * Get or set the Time of Interest. The Time of Interest is a single point
   * in time, and constitutes the temporal focus of application views. It can
   * be manipulated by the user from the time conductor or from other views.
   * The time of interest can effectively be unset by assigning a value of
   * 'undefined'.
   * @fires module:openmct.TimeAPI~timeOfInterest
   * @param newTOI
   * @returns {number} the current time of interest
   * @memberof module:openmct.TimeAPI#
   * @method timeOfInterest
   */
  timeOfInterest(newTOI) {
    if (arguments.length > 0) {
      this.toi = newTOI;
      /**
       * The Time of Interest has moved.
       * @event timeOfInterest
       * @memberof module:openmct.TimeAPI~
       * @property {number} Current time of interest
       */
      this.emit('timeOfInterest', this.toi);
    }

    return this.toi;
  }
}

export default GlobalTimeContext;
