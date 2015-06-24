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
/*global define*/

define(
    ['./TelemetryQueue', './TelemetryTable', './TelemetryDelegator'],
    function (TelemetryQueue, TelemetryTable, TelemetryDelegator) {
        "use strict";


        /**
         * A TelemetrySubscription tracks latest values for streaming
         * telemetry data and handles notifying interested observers.
         * It implements the interesting behavior behind the
         * `telemetrySubscriber` service.
         *
         * Subscriptions may also be made directly using the
         * `telemetry` capability of a domain objcet; the subscriber
         * uses this as well, but additionally handles delegation
         * (e.g. for telemetry panels) as well as latest-value
         * extraction.
         *
         * @constructor
         * @param $q Angular's $q
         * @param $timeout Angular's $timeout
         * @param {DomainObject} domainObject the object whose
         *        associated telemetry data is of interest
         * @param {Function} callback a function to invoke
         *        when new data has become available.
         * @param {boolean} lossless true if callback should be invoked
         *        once with every data point available; otherwise, multiple
         *        data events in a short period of time will only invoke
         *        the callback once, with access to the latest data
         */
        function TelemetrySubscription($q, $timeout, domainObject, callback, lossless) {
            var delegator = new TelemetryDelegator($q),
                unsubscribePromise,
                telemetryObjectPromise,
                latestValues = {},
                telemetryObjects = [],
                pool = lossless ? new TelemetryQueue() : new TelemetryTable(),
                metadatas,
                unlistenToMutation,
                updatePending;

            // Look up domain objects which have telemetry capabilities.
            // This will either be the object in view, or object that
            // this object delegates its telemetry capability to.
            function promiseRelevantObjects(domainObject) {
                return delegator.promiseTelemetryObjects(domainObject);
            }

            function updateValuesFromPool() {
                var values = pool.poll();
                Object.keys(values).forEach(function (k) {
                    latestValues[k] = values[k];
                });
            }

            // Invoke the observer callback to notify that new streaming
            // data has become available.
            function fireCallback() {
                // Play back from queue if we are lossless
                while (!pool.isEmpty()) {
                    updateValuesFromPool();
                    // Fire callback, if one was provided
                    if (callback) {
                        callback();
                    }
                }

                // Clear the pending flag so that future updates will
                // schedule this callback.
                updatePending = false;
            }

            // Update the latest telemetry data for a specific
            // domain object. This will notify listeners.
            function update(domainObject, telemetry) {
                var count = telemetry && telemetry.getPointCount();

                // Only schedule notification if there isn't already
                // a notification pending (and if we actually have
                // data)
                if (!updatePending && count) {
                    updatePending = true;
                    $timeout(fireCallback, 0);
                }

                // Update the latest-value table
                if (count > 0) {
                    pool.put(domainObject.getId(), {
                        domain: telemetry.getDomainValue(count - 1),
                        range: telemetry.getRangeValue(count - 1)
                    });
                }
            }

            // Prepare a subscription to a specific telemetry-providing
            // domain object.
            function subscribe(domainObject) {
                var telemetryCapability =
                    domainObject.getCapability("telemetry");
                return telemetryCapability.subscribe(function (telemetry) {
                    update(domainObject, telemetry);
                });
            }

            // Look up metadata associated with an object's telemetry
            function lookupMetadata(domainObject) {
                var telemetryCapability =
                    domainObject.getCapability("telemetry");
                return telemetryCapability &&
                        telemetryCapability.getMetadata();
            }

            // Prepare subscriptions to all relevant telemetry-providing
            // domain objects.
            function subscribeAll(domainObjects) {
                return domainObjects.map(subscribe);
            }

            // Cache a reference to all relevant telemetry-providing
            // domain objects. This will be called during the
            // initial subscription chain; this allows `getTelemetryObjects()`
            // to return a non-Promise to simplify usage elsewhere.
            function cacheObjectReferences(objects) {
                telemetryObjects = objects;
                metadatas = objects.map(lookupMetadata);
                // Fire callback, as this will be the first time that
                // telemetry objects are available, or these objects
                // will have changed.
                if (callback) {
                    callback();
                }
                return objects;
            }

            function unsubscribeAll() {
                return unsubscribePromise.then(function (unsubscribes) {
                    return $q.all(unsubscribes.map(function (unsubscribe) {
                        return unsubscribe();
                    }));
                });
            }

            function initialize() {
                // Get a reference to relevant objects (those with telemetry
                // capabilities) and subscribe to their telemetry updates.
                // Keep a reference to their promised return values, as these
                // will be unsubscribe functions. (This must be a promise
                // because delegation is supported, and retrieving delegate
                // telemetry-capable objects may be an asynchronous operation.)
                telemetryObjectPromise = promiseRelevantObjects(domainObject);
                unsubscribePromise = telemetryObjectPromise
                        .then(cacheObjectReferences)
                        .then(subscribeAll);
            }

            function idsMatch(ids) {
                return ids.length === telemetryObjects.length &&
                    ids.every(function (id, index) {
                        return telemetryObjects[index].getId() === id;
                    });
            }

            function modelChange(model) {
                if (!idsMatch((model || {}).composition || [])) {
                    // Reinitialize if composition has changed
                    unsubscribeAll().then(initialize);
                }
            }

            function addMutationListener() {
                var mutation = domainObject.getCapability('mutation');
                if (mutation) {
                    return mutation.listen(modelChange);
                }
            }

            initialize();
            unlistenToMutation = addMutationListener();

            return {
                /**
                 * Terminate all underlying subscriptions associated
                 * with this object.
                 * @method
                 * @memberof TelemetrySubscription
                 */
                unsubscribe: function () {
                    if (unlistenToMutation) {
                        unlistenToMutation();
                    }
                    return unsubscribeAll();
                },
                /**
                 * Get the most recent domain value that has been observed
                 * for the specified domain object. This will typically be
                 * a timestamp.
                 *
                 * The domain object passed here should be one that is
                 * subscribed-to here; that is, it should be one of the
                 * domain objects returned by `getTelemetryObjects()`.
                 *
                 * @param {DomainObject} domainObject the object of interest
                 * @returns the most recent domain value observed
                 * @method
                 * @memberof TelemetrySubscription
                 */
                getDomainValue: function (domainObject) {
                    var id = domainObject.getId();
                    return (latestValues[id] || {}).domain;
                },
                /**
                 * Get the most recent range value that has been observed
                 * for the specified domain object. This will typically
                 * be a numeric measurement.
                 *
                 * The domain object passed here should be one that is
                 * subscribed-to here; that is, it should be one of the
                 * domain objects returned by `getTelemetryObjects()`.
                 *
                 * @param {DomainObject} domainObject the object of interest
                 * @returns the most recent range value observed
                 * @method
                 * @memberof TelemetrySubscription
                 */
                getRangeValue: function (domainObject) {
                    var id = domainObject.getId();
                    return (latestValues[id] || {}).range;
                },
                /**
                 * Get all telemetry-providing domain objects which are
                 * being observed as part of this subscription.
                 *
                 * Capability delegation will be taken into account (so, if
                 * a Telemetry Panel was passed in the constructor, this will
                 * return its contents.) Capability delegation is resolved
                 * asynchronously so the return value here may change over
                 * time; while this resolution is pending, this method will
                 * return an empty array.
                 *
                 * @returns {DomainObject[]} all subscribed-to domain objects
                 * @method
                 * @memberof TelemetrySubscription
                 */
                getTelemetryObjects: function () {
                    return telemetryObjects;
                },
                /**
                 * Get all telemetry metadata associated with
                 * telemetry-providing domain objects managed by
                 * this controller.
                 *
                 * This will ordered in the
                 * same manner as `getTelemetryObjects()` or
                 * `getResponse()`; that is, the metadata at a
                 * given index will correspond to the telemetry-providing
                 * domain object at the same index.
                 * @returns {Array} an array of metadata objects
                 */
                getMetadata: function () {
                    return metadatas;
                },
                /**
                 * Get a promise for all telemetry-providing objects
                 * associated with this subscription.
                 * @returns {Promise.<DomainObject[]>} a promise for
                 *          telemetry-providing objects
                 */
                promiseTelemetryObjects: function () {
                    // Unsubscribe promise is available after objects
                    // are loaded.
                    return telemetryObjectPromise;
                }
            };
        }

        return TelemetrySubscription;

    }
);
