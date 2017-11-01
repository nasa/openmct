/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define(['./PerObjectTelemetryProvider'], function (PerObjectTelemetryProvider) {

    function MeanTelemetryProvider(openmct) {
        this.openmct = openmct;
        this.perObjectProviders = {};
    }

    MeanTelemetryProvider.prototype.canProvideTelemetry = function (domainObject) {
        return domainObject.type === 'telemetry-mean';
    };

    MeanTelemetryProvider.prototype.supportsRequest =
        MeanTelemetryProvider.prototype.supportsSubscribe =
            MeanTelemetryProvider.prototype.canProvideTelemetry;

    MeanTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        var perObjectProvider = this.getOrCreatePerObjectProvider(domainObject);
        var wrappedUnsubscribe = perObjectProvider.subscribe(callback);

        return function unsubscribe () {
            var mapKey = [domainObject.identifier.namespace, domainObject.identifier.key].join(':');

            wrappedUnsubscribe();

            if (perObjectProvider.subscribers === 0) {
                delete this.perObjectProviders[mapKey];
            }
        }.bind(this);
    };

    MeanTelemetryProvider.prototype.request = function (domainObject, request) {
        var perObjectProvider = this.getOrCreatePerObjectProvider(domainObject);
        return perObjectProvider.request(request);
    };

    MeanTelemetryProvider.prototype.getOrCreatePerObjectProvider = function (domainObject) {
        var mapKey = [domainObject.identifier.namespace, domainObject.identifier.key].join(':');

        if (!this.perObjectProviders[mapKey]){
            this.perObjectProviders[mapKey] = new PerObjectTelemetryProvider(domainObject, this.openmct);
        }
        return this.perObjectProviders[mapKey];
    }

    return MeanTelemetryProvider;
});
