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

import { STREAM_TYPE } from './constants.js';
import sampleEvents from './fixtures/earth-001.events.json';
import { normalizeEvents } from './verificationEventsAdapter.js';

export default class VerificationTelemetryProvider {
  constructor(options = {}) {
    this.events = normalizeEvents(options.events || sampleEvents);
    this.subscribeInterval = Number(options.subscribeInterval || 1000);
  }

  supportsRequest(domainObject) {
    return domainObject.type === STREAM_TYPE;
  }

  request(domainObject, options = {}) {
    const start = Number(options.start ?? Number.MIN_SAFE_INTEGER);
    const end = Number(options.end ?? Number.MAX_SAFE_INTEGER);
    const size = Number(options.size || this.events.length);
    const filtered = this.events.filter((event) => event.utc >= start && event.utc <= end);

    if (options.strategy === 'latest' || options.size === 1) {
      return Promise.resolve(filtered.length ? [filtered[filtered.length - 1]] : []);
    }

    return Promise.resolve(filtered.slice(0, size));
  }

  supportsSubscribe(domainObject) {
    return domainObject.type === STREAM_TYPE;
  }

  subscribe(domainObject, callback) {
    if (!this.events.length) {
      return function unsubscribe() {};
    }

    let index = 0;
    const interval = setInterval(() => {
      callback(this.events[index]);
      index = (index + 1) % this.events.length;
    }, this.subscribeInterval);

    return function unsubscribe() {
      clearInterval(interval);
    };
  }
}
