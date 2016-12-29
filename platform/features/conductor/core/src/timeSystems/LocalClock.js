/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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

define(['./TickSource'], (TickSource) => {
    /**
     * @implements TickSource
     * @constructor
     */
    class LocalClock extends TickSource {
      constructor($timeout, period) {
        super();
        TickSource.call(this);

        this.metadata = {
            key: 'local',
            mode: 'realtime',
            cssclass: 'icon-clock',
            label: 'Real-time',
            name: 'Real-time Mode',
            description: 'Monitor real-time streaming data as it comes in. The Time Conductor and displays will automatically advance themselves based on a UTC clock.'
        };

        this.period = period;
        this.$timeout = $timeout;
        this.timeoutHandle = undefined;
    }

      start() {
        this.timeoutHandle = this.$timeout(this.tick.bind(this), this.period);
    };

    stop() {
        if (this.timeoutHandle) {
            this.$timeout.cancel(this.timeoutHandle);
        }
    };

    tick() {
        let now = Date.now();
        this.listeners.forEach( (listener) => {
            listener(now);
        });
        this.timeoutHandle = this.$timeout(this.tick.bind(this), this.period);
    };

    /**
     * Register a listener for the local clock. When it ticks, the local
     * clock will provide the current local system time
     *
     * @param listener
     * @returns {function} a function for deregistering the provided listener
     */
    listen(listener) {
        let listeners = this.listeners;
        listeners.push(listener);

        if (listeners.length === 1) {
            this.start();
        }

        return () => {
            listeners.splice(listeners.indexOf(listener));
            if (listeners.length === 0) {
                this.stop();
            }
        }
    };
  }
    return LocalClock;
});
