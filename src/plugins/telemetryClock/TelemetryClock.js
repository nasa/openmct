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

import throttle from 'lodash/throttle';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import clockReadyRequestInterceptor from '../../utils/clock/clockReadyRequestInterceptor.js';
import DefaultClock from '../../utils/clock/DefaultClock.js';

const DEFAULT_TICK_PERIOD_MILLISECONDS = 100;
const NO_TICK_YET = 0;

/**
 * A {@link openmct.TimeAPI.Clock} that derives the current time from the
 * timestamps of all telemetry arriving anywhere in the application, rather
 * than from the local system clock.
 *
 * This allows Open MCT to follow a time source that is not wall clock aligned,
 * such as a simulation, a replay, or a test bed running faster or slower than
 * real time.
 *
 * The clock is monotonic. Only a timestamp strictly newer than the last one
 * emitted will advance it, so out of order telemetry cannot drag time
 * backwards. It does not tick at all until the first datum arrives, and never
 * falls back to the local system clock.
 *
 * @param {import('../../openmct').OpenMCT} openmct
 * @param {number} [tickPeriod] the minimum interval, in milliseconds, between
 *        ticks. Telemetry arriving within a single period is coalesced into
 *        one tick carrying the newest timestamp seen.
 * @constructor
 */
export default class TelemetryClock extends DefaultClock {
  #openmct;
  #newestTimestampSeen;
  #tickWithNewestTimestamp;
  #stopObservingSubscriptions;
  #restartOnTimeSystemChange;

  constructor(openmct, tickPeriod = DEFAULT_TICK_PERIOD_MILLISECONDS) {
    super();

    this.key = 'telemetry-clock';
    this.name = 'Telemetry Clock';
    this.cssClass = 'icon-telemetry';
    this.description =
      'Ticks from the timestamps of all incoming telemetry. Does not tick until telemetry arrives.';

    this.#openmct = openmct;

    // A value of zero means "has not ticked yet". Both the request interceptor
    // and TimeContext.now() rely on this.
    this.lastTick = NO_TICK_YET;
    this.#newestTimestampSeen = NO_TICK_YET;

    this.#tickWithNewestTimestamp = throttle(this.#emitNewestTimestamp.bind(this), tickPeriod);
    this.#restartOnTimeSystemChange = this.#restartForNewTimeSystem.bind(this);

    this.#openmct.telemetry.addRequestInterceptor(
      clockReadyRequestInterceptor(this.#openmct, this)
    );
  }

  start() {
    this.#observeAllTelemetrySubscriptions();
    this.#openmct.time.on(TIME_CONTEXT_EVENTS.timeSystem, this.#restartOnTimeSystemChange);
  }

  stop() {
    this.#openmct.time.off(TIME_CONTEXT_EVENTS.timeSystem, this.#restartOnTimeSystemChange);
    this.#tickWithNewestTimestamp.cancel();
    this.#stopObservingSubscriptions();
    this.#stopObservingSubscriptions = undefined;

    // lastTick is deliberately left alone. Monotonicity should survive
    // switching away to another clock and back again.
  }

  /**
   * Watch every telemetry subscription in the application, present and future,
   * for timestamps.
   */
  #observeAllTelemetrySubscriptions() {
    this.#stopObservingSubscriptions = this.#openmct.telemetry.addSubscriptionObserver(
      (domainObject) => this.#observeTimestampsFrom(domainObject)
    );
  }

  /**
   * Resolve the value formatter for the active time system once per
   * subscription and close over it, so that no lookup is required for each
   * datum that arrives.
   *
   * Returns undefined for objects that carry no timestamp in the active time
   * system. Those objects are reconsidered if the time system changes.
   */
  #observeTimestampsFrom(domainObject) {
    const metadata = this.#openmct.telemetry.getMetadata(domainObject);
    const timeSystemKey = this.#openmct.time.getTimeSystem().key;
    const timestampMetadata = metadata.value(timeSystemKey);

    if (timestampMetadata === undefined) {
      return undefined;
    }

    const timestampFormatter = this.#openmct.telemetry.getValueFormatter(timestampMetadata);

    return (datum) => this.#observeTimestamp(timestampFormatter.parse(datum));
  }

  /**
   * Timestamps in a new time system are on a different scale and epoch
   * entirely, so the time we have already reported is meaningless and the
   * monotonic gate would block forever. Return to the un-ticked state and wait
   * for data exactly as at startup, which also re-arms the request interceptor.
   *
   * Rebuilding every observer, rather than refreshing a list of them, means
   * objects that carried no timestamp in the previous time system are
   * reconsidered under the new one.
   */
  #restartForNewTimeSystem() {
    this.#tickWithNewestTimestamp.cancel();

    this.lastTick = NO_TICK_YET;
    this.#newestTimestampSeen = NO_TICK_YET;

    this.#stopObservingSubscriptions();
    this.#observeAllTelemetrySubscriptions();
  }

  /**
   * The monotonic gate. A datum carrying no value for the active time system
   * parses to NaN, and every comparison against NaN is false, so it is ignored
   * without needing a guard.
   */
  #observeTimestamp(timestamp) {
    if (timestamp > this.#newestTimestampSeen) {
      this.#newestTimestampSeen = timestamp;
      this.#tickWithNewestTimestamp();
    }
  }

  /**
   * Reads the accumulated timestamp rather than taking it as an argument, so
   * that a coalesced tick always carries the newest value seen rather than
   * whichever one happened to trigger it.
   */
  #emitNewestTimestamp() {
    this.tick(this.#newestTimestampSeen);
  }
}
