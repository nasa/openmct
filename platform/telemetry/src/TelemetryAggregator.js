/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
 * This bundle provides infrastructure and utility services for handling
 * telemetry data.
 * @namespace platform/telemetry
 */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
 * This bundle provides infrastructure and utility services for handling
 * telemetry data.
 * @namespace platform/telemetry
 */
function TelemetryAggregator($q, telemetryProviders) {
    this.$q = $q;
    this.telemetryProviders = telemetryProviders;
}

// Merge the results from many providers into one
// result object.
function mergeResults(results) {
    var merged = {};

    results.forEach(function (result) {
        Object.keys(result).forEach(function (k) {
            merged[k] = result[k];
        });
    });

    return merged;
}

// Request telemetry from all providers; once they've
// responded, merge the results into one result object.
TelemetryAggregator.prototype.requestTelemetry = function (requests) {
    return this.$q.all(this.telemetryProviders.map(function (provider) {
        return provider.requestTelemetry(requests);
    })).then(mergeResults);
};

// Subscribe to updates from all providers
TelemetryAggregator.prototype.subscribe = function (callback, requests) {
    var unsubscribes = this.telemetryProviders.map(function (provider) {
        return provider.subscribe(callback, requests);
    });

    // Return an unsubscribe function that invokes unsubscribe
    // for all providers.
    return function () {
        unsubscribes.forEach(function (unsubscribe) {
            if (unsubscribe) {
                unsubscribe();
            }
        });
    };
};

export default TelemetryAggregator;