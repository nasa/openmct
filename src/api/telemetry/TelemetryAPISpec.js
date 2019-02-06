/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    './TelemetryAPI'
], function (
    TelemetryAPI
) {
    describe('Telemetry API', function () {
        var openmct;
        var telemetryAPI;

        beforeEach(function () {
            openmct = {
                time: jasmine.createSpyObj('timeAPI', [
                    'timeSystem',
                    'bounds'
                ])
            };
            openmct.time.timeSystem.and.returnValue({key: 'system'});
            openmct.time.bounds.and.returnValue({start: 0, end: 1});
            telemetryAPI = new TelemetryAPI(openmct);

        });

        describe('telemetry providers', function () {
            var telemetryProvider,
                domainObject;

            beforeEach(function () {
                telemetryProvider = jasmine.createSpyObj('telemetryProvider', [
                    'supportsSubscribe',
                    'subscribe',
                    'supportsRequest',
                    'request'
                ]);
                domainObject = {
                    identifier: {
                        key: 'a',
                        namespace: 'b'
                    },
                    type: 'sample-type'
                };
            });

            it('provides consistent results without providers', function () {
                var unsubscribe = telemetryAPI.subscribe(domainObject);
                expect(unsubscribe).toEqual(jasmine.any(Function));

                var response = telemetryAPI.request(domainObject);
                expect(response).toEqual(jasmine.any(Promise));
            });

            it('skips providers that do not match', function () {
                telemetryProvider.supportsSubscribe.and.returnValue(false);
                telemetryProvider.supportsRequest.and.returnValue(false);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.supportsSubscribe)
                    .toHaveBeenCalledWith(domainObject);
                expect(telemetryProvider.subscribe).not.toHaveBeenCalled();
                expect(unsubscribe).toEqual(jasmine.any(Function));

                var response = telemetryAPI.request(domainObject);
                expect(telemetryProvider.supportsRequest)
                    .toHaveBeenCalledWith(domainObject, jasmine.any(Object));
                expect(telemetryProvider.request).not.toHaveBeenCalled();
                expect(response).toEqual(jasmine.any(Promise));
            });

            it('sends subscribe calls to matching providers', function () {
                var unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.supportsSubscribe.calls.count()).toBe(1);
                expect(telemetryProvider.supportsSubscribe)
                    .toHaveBeenCalledWith(domainObject);
                expect(telemetryProvider.subscribe.calls.count()).toBe(1);
                expect(telemetryProvider.subscribe)
                    .toHaveBeenCalledWith(domainObject, jasmine.any(Function));

                var notify = telemetryProvider.subscribe.calls.mostRecent().args[1];
                notify('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');

                expect(unsubscribe).toEqual(jasmine.any(Function));
                expect(unsubFunc).not.toHaveBeenCalled();
                unsubscribe();
                expect(unsubFunc).toHaveBeenCalled();

                notify('otherValue');
                expect(callback).not.toHaveBeenCalledWith('otherValue');
            });

            it('subscribes once per object', function () {
                var unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var callbacktwo = jasmine.createSpy('callback two');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                var unsubscribetwo = telemetryAPI.subscribe(domainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.count()).toBe(1);

                var notify = telemetryProvider.subscribe.calls.mostRecent().args[1];
                notify('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');
                expect(callbacktwo).toHaveBeenCalledWith('someValue');

                unsubscribe();
                expect(unsubFunc).not.toHaveBeenCalled();
                notify('otherValue');
                expect(callback).not.toHaveBeenCalledWith('otherValue');
                expect(callbacktwo).toHaveBeenCalledWith('otherValue');

                unsubscribetwo();
                expect(unsubFunc).toHaveBeenCalled();
                notify('anotherValue');
                expect(callback).not.toHaveBeenCalledWith('anotherValue');
                expect(callbacktwo).not.toHaveBeenCalledWith('anotherValue');
            });

            it('does subscribe/unsubscribe', function () {
                var unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.and.returnValue(unsubFunc);
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.subscribe.calls.count()).toBe(1);
                unsubscribe();

                unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.subscribe.calls.count()).toBe(2);
                unsubscribe();
            });

            it('subscribes for different object', function () {
                var unsubFuncs = [];
                var notifiers = [];
                telemetryProvider.supportsSubscribe.and.returnValue(true);
                telemetryProvider.subscribe.and.callFake(function (obj, cb) {
                    var unsubFunc = jasmine.createSpy('unsubscribe ' + unsubFuncs.length);
                    unsubFuncs.push(unsubFunc);
                    notifiers.push(cb);
                    return unsubFunc;
                });
                telemetryAPI.addProvider(telemetryProvider);

                var otherDomainObject = JSON.parse(JSON.stringify(domainObject));
                otherDomainObject.identifier.namespace = 'other';

                var callback = jasmine.createSpy('callback');
                var callbacktwo = jasmine.createSpy('callback two');

                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                var unsubscribetwo = telemetryAPI.subscribe(otherDomainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.count()).toBe(2);

                notifiers[0]('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');
                expect(callbacktwo).not.toHaveBeenCalledWith('someValue');

                notifiers[1]('anotherValue');
                expect(callback).not.toHaveBeenCalledWith('anotherValue');
                expect(callbacktwo).toHaveBeenCalledWith('anotherValue');

                unsubscribe();
                expect(unsubFuncs[0]).toHaveBeenCalled();
                expect(unsubFuncs[1]).not.toHaveBeenCalled();

                unsubscribetwo();
                expect(unsubFuncs[1]).toHaveBeenCalled();
            });

            it('sends requests to matching providers', function () {
                var telemPromise = Promise.resolve([]);
                telemetryProvider.supportsRequest.and.returnValue(true);
                telemetryProvider.request.and.returnValue(telemPromise);
                telemetryAPI.addProvider(telemetryProvider);

                var result = telemetryAPI.request(domainObject);
                expect(result).toBe(telemPromise);
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    domainObject,
                    jasmine.any(Object)
                );
                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    domainObject,
                    jasmine.any(Object)
                );
            });

            it('generates default request options', function () {
                telemetryProvider.supportsRequest.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                telemetryAPI.request(domainObject);
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                telemetryProvider.supportsRequest.calls.reset();
                telemetryProvider.request.calls.reset();

                telemetryAPI.request(domainObject, {});
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );
            });

            it('does not overwrite existing request options', function () {
                telemetryProvider.supportsRequest.and.returnValue(true);
                telemetryAPI.addProvider(telemetryProvider);

                telemetryAPI.request(domainObject, {
                    start: 20,
                    end: 30,
                    domain: 'someDomain'
                });

                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 20,
                        end: 30,
                        domain: 'someDomain'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 20,
                        end: 30,
                        domain: 'someDomain'
                    }
                );
            });
        });
    });
});
