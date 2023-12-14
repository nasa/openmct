/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import DefaultClock from '../../utils/clock/DefaultClock';
import remoteClockRequestInterceptor from './requestInterceptor';

/**
 * A {@link openmct.TimeAPI.Clock} that updates the temporal bounds of the
 * application based on a time providing telemetry domainObject.
 *
 * @param {openmct} Object Instance of OpenMCT
 * @param {module:openmct.ObjectAPI~Identifier} identifier An object identifier for
 * the time providing telemetry domainObject
 * @constructor
 */

export default class RemoteClock extends DefaultClock {
  constructor(openmct, identifier) {
    super();

    this.key = 'remote-clock';

    this.openmct = openmct;
    this.identifier = identifier;

    this.name = 'Remote Clock';
    this.description = 'Provides telemetry based timestamps from a configurable source.';

    this.timeTelemetryObject = undefined;
    this.parseTime = undefined;
    this.formatTime = undefined;
    this.metadata = undefined;

    this.lastTick = 0;

    this.openmct.telemetry.addRequestInterceptor(
      remoteClockRequestInterceptor(this.openmct, this.identifier, this.#waitForReady.bind(this))
    );

    this._processDatum = this._processDatum.bind(this);
  }

  start() {
    this.openmct.objects
      .get(this.identifier)
      .then((domainObject) => {
        // The start method is called when at least one listener registers with the clock.
        // When the clock is changed, listeners are unregistered from the clock and the stop method is called.
        // Sometimes, the objects.get call above does not resolve before the stop method is called.
        // So when we proceed with the clock subscription below, we first need to ensure that there is at least one listener for our clock.
        if (this.eventNames().length === 0) {
          return;
        }
        this.openmct.time.on('timeSystem', this._timeSystemChange);
        this.timeTelemetryObject = domainObject;
        this.metadata = this.openmct.telemetry.getMetadata(domainObject);
        this._timeSystemChange();
        this._requestLatest();
        this._subscribe();
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  stop() {
    this.openmct.time.off('timeSystem', this._timeSystemChange);
    if (this._unsubscribe) {
      this._unsubscribe();
    }

    this.removeAllListeners();
  }

  /**
   * Will start a subscription to the timeTelemetryObject as well
   * handle the unsubscribe callback
   *
   * @private
   */
  _subscribe() {
    this._unsubscribe = this.openmct.telemetry.subscribe(
      this.timeTelemetryObject,
      this._processDatum
    );
  }

  /**
   * Will request the latest data for the timeTelemetryObject
   *
   * @private
   */
  _requestLatest() {
    this.openmct.telemetry
      .request(this.timeTelemetryObject, {
        size: 1,
        strategy: 'latest'
      })
      .then((data) => {
        this._processDatum(data[data.length - 1]);
      });
  }

  /**
   * Function to parse the datum from the timeTelemetryObject as well
   * as check if it's valid, calls "tick"
   *
   * @private
   */
  _processDatum(datum) {
    let time = this.parseTime(datum);

    if (time > this.lastTick) {
      this.tick(time);
    }
  }

  /**
   * Callback function for timeSystem change events
   *
   * @private
   */
  _timeSystemChange() {
    let timeSystem = this.openmct.time.timeSystem();
    let timeKey = timeSystem.key;
    let metadataValue = this.metadata.value(timeKey);
    let timeFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);
    this.parseTime = (datum) => {
      return timeFormatter.parse(datum);
    };

    this.formatTime = (datum) => {
      return timeFormatter.format(datum);
    };
  }

  /**
   * Waits for the clock to have a non-default tick value.
   *
   * @private
   */
  #waitForReady() {
    const waitForInitialTick = (resolve) => {
      if (this.lastTick > 0) {
        const offsets = this.openmct.time.clockOffsets();
        resolve({
          start: this.lastTick + offsets.start,
          end: this.lastTick + offsets.end
        });
      } else {
        setTimeout(() => waitForInitialTick(resolve), 100);
      }
    };

    return new Promise(waitForInitialTick);
  }
}
