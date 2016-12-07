/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    '../objects/object-utils'
], function (
    utils
) {
    /**
     * @implements module:openmct.TelemetryAPI~TelemetryProvider
     * @constructor
     */
    function LegacyTelemetryProvider(instantiate) {
        this.instantiate = instantiate;
    }

    /**
     * Can provide telemetry for all objects that have the "telemetry"
     * capability
     *
     * @see module:openmct.TelemetryAPI~TelemetryProvider#canProvideTelemetry
     */
    LegacyTelemetryProvider.prototype.canProvideTelemetry = function (domainObject) {
        return this.instantiate(utils.toOldFormat(domainObject),
            utils.makeKeyString(domainObject.identifier)).hasCapability("telemetry");
    };

    function createDatum(metadata, legacySeries, i) {
        var datum = {};

        metadata.domains.reduce(function (telemetryObject, domain) {
            datum[domain.key] = legacySeries.getDomainValue(i, domain.key);
        }, datum);

        metadata.ranges.reduce(function (telemetryObject, range) {
            datum[range.key] = legacySeries.getRangeValue(i, range.key);
        }, datum);

        return datum;
    }

    function adaptSeries(metadata, legacySeries) {
        var series = [];

        for (var i=0; i < legacySeries.getPointCount(); i++) {
            series.push(createDatum(metadata, legacySeries, i));
        }

        return series;
    }

    /**
     * @typedef {object} ConvertedTelemetryObject
     * Telemetry data objects are converted from TelemetrySeries. Metadata is used
     * to populate the returned object with attributes corresponding to the keys
     * of domains and ranges. The attribute values are those returned by calls to
     * [TelemetrySeries.getDomainValue()]{@link TelemetrySeries#getDomainValue}
     * and [TelemetrySeries.getRangeValue()]{@link TelemetrySeries#getRangeValue}.
     */

    /**
     * @see module:openmct.TelemetryAPI~TelemetryProvider#request
     * @param {module:openmct.DomainObject}
     * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
     *        options for this request. Passed straight through to legacy provider
     * @returns {Promise.<ConvertedTelemetryObject[]>} a promise for an array of
     *          telemetry data.
     */
    LegacyTelemetryProvider.prototype.request = function (domainObject, request) {
        var oldObject = this.instantiate(utils.toOldFormat(domainObject), utils.makeKeyString(domainObject.identifier));
        var capability = oldObject.getCapability("telemetry");

        return capability.requestData(request).then(function (telemetrySeries) {
            return Promise.resolve(adaptSeries(capability.getMetadata(), telemetrySeries));
        }).catch(function (error) {
            return Promise.reject(error);
        });
    };

    /**
     * @callback LegacyTelemetryProvider~SubscribeCallback
     * @param {ConvertedTelemetryObject}
     */

    /**
     * @see module:openmct.TelemetryAPI~TelemetryProvider#request
     * @param {module:openmct.DomainObject}
     * @param {LegacyTelemetryProvider~SubscribeCallback} callback will be called with a single datum when
     * new data is available.
     * @param {module:openmct.TelemetryAPI~TelemetryRequest} options
     *        options for this request. Passed straight through to legacy provider
     * @returns {platform|telemetry.TelemetrySubscription|*}
     */
    LegacyTelemetryProvider.prototype.subscribe = function (domainObject, callback, request) {
        var oldObject = this.instantiate(utils.toOldFormat(domainObject), utils.makeKeyString(domainObject.identifier));
        var capability = oldObject.getCapability("telemetry");

        function callbackWrapper(series){
            callback(createDatum(capability.getMetadata(), series, series.getPointCount()-1));
        }

        return capability.subscribe(callbackWrapper, request);
    };

    function notImplemented () {
        console.error("function not implemented");
    }

    LegacyTelemetryProvider.prototype.properties = notImplemented;
    LegacyTelemetryProvider.prototype.limitEvaluator = notImplemented;
    LegacyTelemetryProvider.prototype.formatter = notImplemented;

    return function (openmct, instantiate) {
        // Push onto the start of the default providers array so that it's
        // always the last resort
        openmct.telemetry.defaultProviders.unshift(
            new LegacyTelemetryProvider(instantiate));
    };

});