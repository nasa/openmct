/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
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
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
define([
    './latestValueSubscription'
], function (
    latestValueSubscription
) {

    describe("latestValueSubscription", function () {

        var openmct;
        var telemetryAPI;
        var formatMap;
        var pendingRequests;
        var subscriptions;
        var domainObject;
        var callback;
        var unsubscribe;

        beforeEach(function () {
            openmct = {
                time: jasmine.createSpyObj('timeAPI', [
                    'clock',
                    'timeSystem',
                    'bounds',
                    'on',
                    'off'
                ])
            };

            openmct.time.timeSystem.and.return({
                key: 'testKey'
            });

            telemetryAPI = jasmine.createSpyObj('telemetryAPI', [
                'getMetadata',
                'getFormatMap',
                'request',
                'subscribe'
            ]);

            telemetryAPI.getMetadata.and.return('metadata');

            formatMap = {
                testKey: jasmine.createSpyObj('testFormatter', ['parse']),
                otherKey: jasmine.createSpyObj('otherFormatter', ['parse'])
            };
            telemetryAPI.getFormatMap.and.return(formatMap);

            pendingRequests = [];
            telemetryAPI.request.and.callFake(function (domainObject, options) {
                var request = {
                    domainObject: domainObject,
                    options: options
                };
                request.promise = new Promise(function (resolve, reject)) {
                    request.resolve = resolve;
                    request.reject = reject;
                });
                pendingRequests.push(request);
                return request.promise;
            });

            subscriptions = [];
            telemetryAPI.subscribe.and.callFake(function (domainObject, callback) {
                var subscription = {
                    domainObject: domainObject,
                    callback: callback,
                    unsubscribe: jasmine.createSpy('unsubscribe')
                };
                subscriptions.push(subscription);
                return subscription.unsubscribe;
            });

            callback = jasmine.createSpy('callback');

            domainObject = {};
        });


        // A simple test case to make sure we have appropriate mocks.
        it("requests, subscribes, and unsubscribes", function () {
            var unsubscribe = latestValueSubscription(
                domainObject,
                callback,
                telemetryAPI,
                openmct
            );

            expect(unsubscribe).toEqual(jasmine.any(Function));
            expect(telemetryAPI.request)
                .toHaveBeenCalledWith(domainObject, jasmine.any(Object))
            expect(telemetryAPI.subscribe)
                .toHaveBeenCalledWith(domainObject, jasmine.any(Function))
            expect(subscriptions[0].unsubscribe).not.toHaveBeenCalled();

            unsubscribe();

            expect(subscriptions[0].unsubscribe).toHaveBeenCalled();
        });

        /** TODO:
         * test lad response inside bounds, outside bounds, no response.
         * test realtime should wait until lad response (all cases);
         * realtime should only notify if later than latest (or no latest).
         *
         * timesystem change should clear and re-request LAD.
         * clock change should enable/disable bounds filtering.
         * non-tick bounds change should clear and
         *
         *
         * should receive lad response
         * should receive realtime if later than lad.
         * should receive lad response (unless outside)
         * subscriptions should wait for lad response
         *
        */
        describe("no clock (AKA fixed)", function () {
            var unsubscribe;

            beforeEach(function () {
                unsubscribe = latestValueSubscription(
                    domainObject,
                    callback,
                    telemetryAPI,
                    openmct
                );
            });

            describe("nominal LAD response", function () {

            });
            describe("out of bounds LAD response", function () {

            });
            describe("no LAD response", function () {

            });
        });

        describe("with clock (AKA realtime)", function () {
            describe("nominal LAD response", function () {

            });
            describe("no LAD response", function () {

            });
        });

        describe("clock changes", function () {

        });

        describe("timesystem changes", function () {

        });

        describe("on bounds event", function () {

        });
    });

});
