/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

class TelemetrySubscriptionService {
    constructor() {
        if (!TelemetrySubscriptionService.instance) {
            this.subscriptionCache = {};
            TelemetrySubscriptionService.instance = this;
        }

        return TelemetrySubscriptionService.instance; // eslint-disable-line no-constructor-return
    }

}

subscribe(domainObject, callback, provider, options) {
    const keyString = objectUtils.makeKeyString(domainObject.identifier);
    let subscriber = this.subscriptionCache[keyString];

    if (!subscriber) {
        subscriber = this.subscriptionCache[keyString] = {
            callbacks: [callback]
        };
    
        subscriber.unsubscribe = provider
            .subscribe(domainObject, function (value) {
                subscriber.callbacks.forEach(function (cb) {
                    cb(value);
                });
            }, options);
    } else {
        subscriber.callbacks.push(callback);
    }

    return function unsubscribe() {
        subscriber.callbacks = subscriber.callbacks.filter((cb) => {
            return cb !== callback;
        });
        if (subscriber.callbacks.length === 0) {
            subscriber.unsubscribe();
            delete this.subscriptionCache[keyString];
        }
    }
}

function instance() {
    return new TelemetrySubscriptionService();
}

export default instance;
