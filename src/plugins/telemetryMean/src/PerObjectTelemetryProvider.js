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

define([], function () {

    /**
     * Tracks subscriptions and requests for a particular object.
     * 
     * This class makes some assumptions that make it NON-GENERALIZABLE.
     * 1. It assumes that there will NOT be more than one date range requested 
     *    per object at a time. ie. it assumes that the time conductor bounds are 
     *    the only thing dictating historical data requests.
     * 2. IF historical and realtime data are requested at the same time, it 
     *    assumes that the historical and real-time data ARE CONTIGUOUS.
     * 3. It assumes all data it receives is timestamped with a key called 'utc'
     * 
     * @param {*} domainObject 
     * @param {*} openmct 
     */
    function PerObjectTelemetryProvider(domainObject, openmct) {
        this.domainObject = domainObject;
        this.telemetryApi = openmct.telemetry;
        this.objectApi = openmct.objects;
        this.subscribers = 0;
        this.requestOutstanding = false;
        this.keyForTimestamp = 'utc';
        this.mostRecentData = [];
        this.sampleSize = domainObject.samples;
        this.rangeKey = this.getRangeKey();

        [
            'processTelemetryDatum',
            'receiveRealtimeTelemetry',
            'requestTelemetryForLinkedObject'
        ].forEach(function(functionName) {
            this[functionName] = this[functionName].bind(this);
        }.bind(this));
    }

    PerObjectTelemetryProvider.prototype.subscribe = function (callback) {
        var promiseForObject = this.getLinkedObject(this.domainObject);
        return this.subscribeToWrappedObject(promiseForObject, callback);
    };

    PerObjectTelemetryProvider.prototype.request = function (request) {
        this.requestOutstanding = true;

        return this.getLinkedObject(this.domainObject).then(function (linkedObject) {
            return this.requestTelemetryForLinkedObject(linkedObject, request);
        }.bind(this));
    }

    PerObjectTelemetryProvider.prototype.requestTelemetryForLinkedObject = function (linkedObject, request) {
        return this.telemetryApi.request(linkedObject, request).then(function (data) {
            this.requestOutstanding = false;
            return this.calculateAveragesForData(data);
        }.bind(this));
    };

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.getLinkedObject = function (domainObject) {
        function createIdentifier(idString) {
            var tokens = idString.split(':');
            if (tokens.length === 1) {
                return {
                    key: tokens[0]
                }
            } else {
                return {
                    namespace: tokens[0],
                    key: tokens[1]
                }
            }
        }

        var objectId = createIdentifier(domainObject.telemetryPoint);
        return this.objectApi.get(objectId);
    };

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.subscribeToWrappedObject = function (promiseForObject, callback) {
        var wrappedUnsubscribe;
        var unsubscribeCalled = false;
        var telemetryBuffer = [];
        this.subscribers++;

        promiseForObject.then(function subscribe(linkedObject) {
            if (!unsubscribeCalled && linkedObject){
                wrappedUnsubscribe = this.telemetryApi.subscribe(linkedObject, function (telemetryDatum) {
                    this.receiveRealtimeTelemetry(telemetryDatum, telemetryBuffer, callback)
                }.bind(this));
            }
        }.bind(this));
        
        return function unsubscribe(){
            this.subscribers--;
            unsubscribeCalled = true;

            if (wrappedUnsubscribe !== undefined) {
                wrappedUnsubscribe();
            }
        }.bind(this);

    }

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.calculateAveragesForData = function (data) {
        return data.map(this.processTelemetryDatum);
    }

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.receiveRealtimeTelemetry = function (telemetryDatum, telemetryBuffer, callback) {
        if (this.requestOutstanding) {
            telemetryBuffer.push(telemetryDatum);
        } else {
            if (telemetryBuffer.length > 0) {
                telemetryBuffer.forEach(function (bufferedDatum){
                    callback(this.processTelemetryDatum(telemetryDatum));
                }.bind(this));
            }
            var avgData = this.processTelemetryDatum(telemetryDatum);
            callback(avgData);
        }
    };

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.processTelemetryDatum = function (telemetryDatum) {
        if (this.isMostRecentData(telemetryDatum)){
            this.updateMostRecentData(telemetryDatum);
        }

        return this.calculateMeansForDatum(telemetryDatum, this.rangeKey);
    }

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.isMostRecentData = function (datum) {
        var datumTimestamp = parseInt(datum[this.keyForTimestamp]);
        var latestTimestamp = parseInt(this.mostRecentData[this.mostRecentData.length]);

        return isNaN(latestTimestamp) || datumTimestamp > latestTimestamp;
    }

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.updateMostRecentData = function (datum) {
        this.mostRecentData.push(datum);
        if (this.mostRecentData.length > this.sampleSize) {
            this.mostRecentData.shift();
        }
    }

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.calculateMeansForDatum = function (telemetryDatum, keyToMean) {
        var meanDatum = {
            'utc': telemetryDatum['utc'],
            'value': this.calculateMean(keyToMean)
        }
        return meanDatum;
    }

    /**
     * @private
     */
    PerObjectTelemetryProvider.prototype.calculateMean = function (valueToMean) {
        return this.mostRecentData.reduce(function (sum, datum){
            return sum + datum[valueToMean];
        }, 0) / this.mostRecentData.length;
    };

    PerObjectTelemetryProvider.prototype.getRangeKey = function () {
        return this.telemetryApi.getMetadata(this.domainObject)
            .valuesForHints(['range'])
            .map(function (metadatum) {
                return metadatum.source;
            })[0];
    }

    return PerObjectTelemetryProvider;
});
