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
 * Module defining EventTelemetryProvider. Created by chacskaylo on 06/18/2015.
 */

import EventTelemetry from "./EventTelemetry";

class EventTelemetryProvider {
    constructor() {
        this.subscriptions = [];
        this.genInterval = 1000;
        this.generating = false;
    }

    matchesSource(request) {
        return request.source === "eventGenerator";
    }

    // Used internally; this will be repacked by doPackage
    generateData(request) {
        return {
            key: request.key,
            telemetry: new EventTelemetry(this.genInterval)
        };
    }

    //
    doPackage(results) {
        var packaged = {};
        results.forEach(function (result) {
            packaged[result.key] = result.telemetry;
        });

        // Format as expected (sources -> keys -> telemetry)
        return { eventGenerator: packaged };
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async requestTelemetry(requests) {
        await this.delay(0);

        return requests.filter(this.matchesSource).map(this.generateData);
    }

    handleSubscriptions() {
        const provider = this;
        provider.subscriptions.forEach(function (subscription) {
            var requests = subscription.requests;
            subscription.callback(requests.filter(provider.matchesSource).map(provider.generateData)
            );
        });
    }

    async startGenerating() {
        this.generating = true;
        await this.delay(this.genInterval);
        this.handleSubscriptions();
        if (this.generating && this.subscriptions.length > 0) {
            this.startGenerating();
        } else {
            this.generating = false;
        }
    }

    subscribe(callback, requests) {
        const subscription = {
            callback: callback,
            requests: requests
        };
        const provider = this;
        function unsubscribe() {
            provider.subscriptions = provider.subscriptions.filter(function (s) {
                return s !== subscription;
            });
        }

        this.subscriptions.push(subscription);
        if (!provider.generating) {
            provider.startGenerating();
        }

        return unsubscribe;
    }
}

export default EventTelemetryProvider;
