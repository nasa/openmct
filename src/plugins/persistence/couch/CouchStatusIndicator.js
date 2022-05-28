/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

// Set of connection states; changing among these states will be
// reflected in the indicator's appearance.
// CONNECTED: Everything nominal, expect to be able to read/write
// DISCONNECTED: HTTP failed; maybe misconfigured, disconnected.
// PENDING: Still trying to connect, and haven't failed yet.
export const CONNECTED = {
    statusClass: "s-status-on"
};
export const PENDING = {
    statusClass: "s-status-warning-lo"
};
export const DISCONNECTED = {
    statusClass: "s-status-warning-hi"
};

/**
 *
 */
export default class CouchStatusIndicator {
    constructor(simpleIndicator) {
        this.indicator = simpleIndicator;
        this.setDefaults();
    }

    setDefaults() {
        this.setIndicatorToState(PENDING);
    }

    /**
     *
     * @param {*} state
     */
    setIndicatorToState(state) {
        switch (state) {
        case CONNECTED: {
            this.indicator.text("CouchDB is connected");
            // this.indicator.description(this.label + " is online, checking status every " + this.interval + " milliseconds.");
            break;
        }

        case PENDING: {
            this.indicator.text("Attempting to connect to CouchDB...");
            // this.indicator.description("Checking status of " + this.label + " please stand by...");
            break;
        }

        case DISCONNECTED: {
            this.indicator.text("CouchDB is offline");
            // this.indicator.description(this.label + " is offline, checking status every " + this.interval + " milliseconds");
            break;
        }
        }

        this.indicator.statusClass(state.statusClass);
    }
}
